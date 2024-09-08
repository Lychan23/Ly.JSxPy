<<<<<<< HEAD
# tts_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyttsx3
import os

class TTSCog(commands.Cog, name="tts"):
    def __init__(self, bot) -> None:
        self.bot = bot
        self.engine = pyttsx3.init()

    # Command to convert text to speech
    @commands.hybrid_command(
        name="tts",
        description="Converts text to speech and sends the audio file.",
    )
    async def tts(self, context: Context, *, text: str) -> None:
        """
        Converts text to speech and sends the audio file.

        :param context: The application command context.
        :param text: The text to convert to speech.
        """
        # Convert text to speech
        audio_path = self.text_to_speech(text)

        # Send the audio file
        if audio_path:
            file = discord.File(audio_path, filename="tts.mp3")
            await context.send(file=file)
            os.remove(audio_path)  # Clean up the file after sending
        else:
            await context.send("Failed to convert text to speech.")

    def text_to_speech(self, text: str) -> str:
        """
        Converts text to speech and saves it as an audio file.

        :param text: The text to convert to speech.
        :return: The file path of the audio file.
        """
        try:
            audio_path = "tts.mp3"
            self.engine.save_to_file(text, audio_path)
            self.engine.runAndWait()
            return audio_path
        except Exception as e:
            print(f"An error occurred while converting text to speech: {e}")
            return None

# And then we finally add the cog to the bot so that it can load, unload, reload and use its content.
async def setup(bot) -> None:
    await bot.add_cog(TTSCog(bot))
=======
# tts_cog.py

import discord
from discord.ext import commands
from discord.ext.commands import Context
import pyttsx3
import os

class TTSCog(commands.Cog, name="tts"):
    def __init__(self, bot) -> None:
        self.bot = bot
        self.engine = pyttsx3.init()

    # Command to convert text to speech
    @commands.hybrid_command(
        name="tts",
        description="Converts text to speech and sends the audio file.",
    )
    async def tts(self, context: Context, *, text: str) -> None:
        """
        Converts text to speech and sends the audio file.

        :param context: The application command context.
        :param text: The text to convert to speech.
        """
        # Convert text to speech
        audio_path = self.text_to_speech(text)

        # Send the audio file
        if audio_path:
            file = discord.File(audio_path, filename="tts.mp3")
            await context.send(file=file)
            os.remove(audio_path)  # Clean up the file after sending
        else:
            await context.send("Failed to convert text to speech.")

    def text_to_speech(self, text: str) -> str:
        """
        Converts text to speech and saves it as an audio file.

        :param text: The text to convert to speech.
        :return: The file path of the audio file.
        """
        try:
            audio_path = "tts.mp3"
            self.engine.save_to_file(text, audio_path)
            self.engine.runAndWait()
            return audio_path
        except Exception as e:
            print(f"An error occurred while converting text to speech: {e}")
            return None

# And then we finally add the cog to the bot so that it can load, unload, reload and use its content.
async def setup(bot) -> None:
    await bot.add_cog(TTSCog(bot))
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
