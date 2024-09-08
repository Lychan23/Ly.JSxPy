<<<<<<< HEAD
# screenshot_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyautogui
import os

class ScreenshotCog(commands.Cog, name="screenshot"):
    def __init__(self, bot) -> None:
        self.bot = bot

    # Command to take a screenshot of the desktop
    @commands.hybrid_command(
        name="screenshot",
        description="Takes a screenshot of the desktop and sends it.",
    )
    async def screenshot(self, context: Context) -> None:
        """
        Takes a screenshot of the desktop and sends it.

        :param context: The application command context.
        """
        # Take the screenshot
        screenshot_path = self.take_screenshot()

        # Send the screenshot
        if screenshot_path:
            file = discord.File(screenshot_path, filename="screenshot.png")
            await context.send(file=file)
            os.remove(screenshot_path)  # Clean up the file after sending
        else:
            await context.send("Failed to take a screenshot of the desktop.")

    def take_screenshot(self) -> str:
        """
        Takes a screenshot of the desktop and returns the file path.

        :return: The file path of the screenshot.
        """
        try:
            screenshot_path = "screenshot.png"
            screenshot = pyautogui.screenshot()
            screenshot.save(screenshot_path)
            return screenshot_path
        except Exception as e:
            print(f"An error occurred while taking a screenshot: {e}")
            return None

# And then we finally add the cog to the bot so that it can load, unload, reload and use its content.
async def setup(bot) -> None:
    await bot.add_cog(ScreenshotCog(bot))
=======
# screenshot_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyautogui
import os

class ScreenshotCog(commands.Cog, name="screenshot"):
    def __init__(self, bot) -> None:
        self.bot = bot

    # Command to take a screenshot of the desktop
    @commands.hybrid_command(
        name="screenshot",
        description="Takes a screenshot of the desktop and sends it.",
    )
    async def screenshot(self, context: Context) -> None:
        """
        Takes a screenshot of the desktop and sends it.

        :param context: The application command context.
        """
        # Take the screenshot
        screenshot_path = self.take_screenshot()

        # Send the screenshot
        if screenshot_path:
            file = discord.File(screenshot_path, filename="screenshot.png")
            await context.send(file=file)
            os.remove(screenshot_path)  # Clean up the file after sending
        else:
            await context.send("Failed to take a screenshot of the desktop.")

    def take_screenshot(self) -> str:
        """
        Takes a screenshot of the desktop and returns the file path.

        :return: The file path of the screenshot.
        """
        try:
            screenshot_path = "screenshot.png"
            screenshot = pyautogui.screenshot()
            screenshot.save(screenshot_path)
            return screenshot_path
        except Exception as e:
            print(f"An error occurred while taking a screenshot: {e}")
            return None

# And then we finally add the cog to the bot so that it can load, unload, reload and use its content.
async def setup(bot) -> None:
    await bot.add_cog(ScreenshotCog(bot))
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
