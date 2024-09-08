# blocker_cog.py

import ctypes
from urllib.parse import urlparse
from discord.ext import commands
from discord.ext.commands import Context
import discord

# Here we name the cog and create a new class for the cog.
class Blocker(commands.Cog, name="blocker"):
    def __init__(self, bot) -> None:
        self.bot = bot
        self.blocked_websites = set()  # Set to store blocked websites

    # Check if the user has the Administrator permission
    async def has_admin_perms(self, context: Context) -> bool:
        return context.author.guild_permissions.administrator

    # Get the hosts file path
    def get_hosts_file_path(self):
        hosts_file_path = r'C:\Windows\System32\drivers\etc\hosts'

        if ctypes.windll.kernel32.GetFileAttributesW(hosts_file_path) != -1:
            return hosts_file_path

        return None

    # Block a website
    def block_website(self, website: str) -> bool:
        parsed_url = urlparse(website)
        host_entry = f"127.0.0.1 {parsed_url.netloc}\n"
        hosts_file_path = self.get_hosts_file_path()

        if hosts_file_path:
            with open(hosts_file_path, 'a') as hosts_file:
                hosts_file.write(host_entry)
            return True

        return False

    # Unblock a website
    def unblock_website(self, website: str) -> bool:
        website = website.replace("https://", "").replace("http://", "")
        hosts_file_path = self.get_hosts_file_path()

        if hosts_file_path:
            with open(hosts_file_path, 'r') as hosts_file:
                lines = hosts_file.readlines()

            filtered_lines = [line for line in lines if website not in line]

            with open(hosts_file_path, 'w') as hosts_file:
                hosts_file.writelines(filtered_lines)
            return True

        return False

    # Command to block a website
    @commands.hybrid_command(
        name="blockwebsite",
        description="Blocks a website from being shared.",
    )
    async def blockwebsite(self, context: Context, website: str) -> None:
        if not await self.has_admin_perms(context):
            await context.send("You do not have permission to use this command.")
            return

        if self.block_website(website):
            self.blocked_websites.add(website)
            embed = discord.Embed(
                title=f"🟢 Success",
                description=f'```Website {website} has been blocked. Unblock it by using /unblockwebsite [website]```',
                colour=discord.Colour.green()
            )
            embed.set_author(name="Blocker Bot")
            await context.send(embed=embed)
        else:
            embed = discord.Embed(
                title="🔴 Hold on!",
                description=f'```Hostfile not found or no permissions```',
                colour=discord.Colour.red()
            )
            embed.set_author(name="Blocker Bot")
            await context.send(embed=embed)

    # Command to list blocked websites
    @commands.hybrid_command(
        name="listblocked",
        description="Lists all blocked websites.",
    )
    async def listblocked(self, context: Context) -> None:
        if not await self.has_admin_perms(context):
            await context.send("You do not have permission to use this command.")
            return

        if self.blocked_websites:
            blocked_list = "\n".join(self.blocked_websites)
            await context.send(f"Blocked websites:\n{blocked_list}")
        else:
            await context.send("No websites are currently blocked.")

    # Command to unblock a website
    @commands.hybrid_command(
        name="unblockwebsite",
        description="Unblocks a website.",
    )
    async def unblockwebsite(self, context: Context, website: str) -> None:
        if not await self.has_admin_perms(context):
            await context.send("You do not have permission to use this command.")
            return

        if website in self.blocked_websites and self.unblock_website(website):
            self.blocked_websites.remove(website)
            embed = discord.Embed(
                title=f"🟢 Success",
                description=f'```Website {website} has been unblocked.```',
                colour=discord.Colour.green()
            )
            embed.set_author(name="Blocker Bot")
            await context.send(embed=embed)
        else:
            embed = discord.Embed(
                title="🔴 Hold on!",
                description=f'```Website {website} is not blocked or no permissions.```',
                colour=discord.Colour.red()
            )
            embed.set_author(name="Blocker Bot")
            await context.send(embed=embed)

# And then we finally add the cog to the bot so that it can load, unload, reload and use its content.
async def setup(bot) -> None:
    await bot.add_cog(Blocker(bot))
