# backend/main.py
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import os

# app = FastAPI()

# Enable CORS
# origins = [
#     "http://localhost:3000",  # Frontend URL
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class Command(BaseModel):
#     name: str
#     desc: str
#     permission: list

# def generate_command_code(command: Command) -> str:
#     permissions = ""
#     if command.permission:
#         permissions = ", ".join(command.permission)
#         permissions = f"""
#     @commands.has_permissions({permissions})
#     @commands.bot_has_permissions({permissions})
#     """

#     return f"""
# import discord
# from discord.ext import commands
# from discord.ext.commands import Context

# class {command.name.capitalize()}Cog(commands.Cog):
#     def __init__(self, bot):
#         self.bot = bot
# {permissions}
#     @commands.hybrid_command(
#         name="{command.name}",
#         description="{command.desc}",
#     )
#     async def {command.name}(self, context: Context) -> None:
#         '''
#         {command.desc}

#         :param context: The hybrid command context.
#         '''
#         embed = discord.Embed(
#             title="{command.desc}",
#             description=f"Command executed successfully!",
#             color=0xBEBEFE,
#         )
#         await context.send(embed=embed)

# def setup(bot):
#     bot.add_cog({command.name.capitalize()}Cog(bot))
# """

# @app.post("/generate-command/")
# def generate_command(command: Command):
#     try:
#         code = generate_command_code(command)
#         filename = f"cogs/{command.name}.py"
#         os.makedirs(os.path.dirname(filename), exist_ok=True)
#         with open(filename, "w") as file:
#             file.write(code)
#         return {"code": code}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))
