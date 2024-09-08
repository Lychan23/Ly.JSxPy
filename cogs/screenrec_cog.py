<<<<<<< HEAD
# screenrec_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyautogui
import numpy as np
import time
import imageio
import os
from getpass import getuser

class ScreenRecCog(commands.Cog, name="screenrec"):
    def __init__(self, bot) -> None:
        self.bot = bot

    @commands.hybrid_command(
        name="screenrec",
        description="Records the screen for 15 seconds and sends the recording.",
    )
    async def screenrec(self, context: Context) -> None:
        """
        Records the screen for 15 seconds and sends the recording.

        :param context: The application command context.
        """
        await context.send("`Recording... Please wait.`")
        output_file = f'C:\\Users\\{getuser()}\\recording.mp4'
        screen_width, screen_height = pyautogui.size()
        screen_region = (0, 0, screen_width, screen_height)
        frames = []
        duration = 15
        fps = 30
        num_frames = duration * fps

        try:
            for _ in range(num_frames):
                img = pyautogui.screenshot(region=screen_region)
                frame = np.array(img)
                frames.append(frame)
                time.sleep(1 / fps)  # Ensure the correct frame rate

            imageio.mimsave(output_file, frames, fps=fps, quality=8)

            file = discord.File(output_file, filename="recording.mp4")
            reaction_msg = await context.send("Screen Recording `[On demand]`", file=file)
            await reaction_msg.add_reaction('📌')

            os.remove(output_file)  # Clean up the file after sending
        except Exception as e:
            embed = discord.Embed(
                title="📛 Error",
                description=f"An error occurred during screen recording: {e}",
                colour=discord.Colour.red()
            )
            await context.send(embed=embed)

async def setup(bot) -> None:
    await bot.add_cog(ScreenRecCog(bot))
=======
# screenrec_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyautogui
import numpy as np
import time
import imageio
import os
from getpass import getuser

class ScreenRecCog(commands.Cog, name="screenrec"):
    def __init__(self, bot) -> None:
        self.bot = bot

    @commands.hybrid_command(
        name="screenrec",
        description="Records the screen for 15 seconds and sends the recording.",
    )
    async def screenrec(self, context: Context) -> None:
        """
        Records the screen for 15 seconds and sends the recording.

        :param context: The application command context.
        """
        await context.send("`Recording... Please wait.`")
        output_file = f'C:\\Users\\{getuser()}\\recording.mp4'
        screen_width, screen_height = pyautogui.size()
        screen_region = (0, 0, screen_width, screen_height)
        frames = []
        duration = 15
        fps = 30
        num_frames = duration * fps

        try:
            for _ in range(num_frames):
                img = pyautogui.screenshot(region=screen_region)
                frame = np.array(img)
                frames.append(frame)
                time.sleep(1 / fps)  # Ensure the correct frame rate

            imageio.mimsave(output_file, frames, fps=fps, quality=8)

            file = discord.File(output_file, filename="recording.mp4")
            reaction_msg = await context.send("Screen Recording `[On demand]`", file=file)
            await reaction_msg.add_reaction('📌')

            os.remove(output_file)  # Clean up the file after sending
        except Exception as e:
            embed = discord.Embed(
                title="📛 Error",
                description=f"An error occurred during screen recording: {e}",
                colour=discord.Colour.red()
            )
            await context.send(embed=embed)

async def setup(bot) -> None:
    await bot.add_cog(ScreenRecCog(bot))
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
