'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { motion } from 'framer-motion';

interface Command {
  name: string;
  desc: string;
  permission: string[];
}

const permissionsList = [
  { label: 'CREATE_INSTANT_INVITE', value: 'create_instant_invite=True' },
  { label: 'KICK_MEMBERS', value: 'kick_members=True' },
  { label: 'BAN_MEMBERS', value: 'ban_members=True' },
  { label: 'ADMINISTRATOR', value: 'administrator=True' },
  { label: 'MANAGE_CHANNELS', value: 'manage_channels=True' },
  { label: 'MANAGE_GUILD', value: 'manage_guild=True' },
  { label: 'ADD_REACTIONS', value: 'add_reactions=True' },
  { label: 'VIEW_AUDIT_LOG', value: 'view_audit_log=True' },
  { label: 'PRIORITY_SPEAKER', value: 'priority_speaker=True' },
  { label: 'STREAM', value: 'stream=True' },
  { label: 'VIEW_CHANNEL', value: 'view_channel=True' },
  { label: 'SEND_MESSAGES', value: 'send_messages=True' },
  { label: 'SEND_TTS_MESSAGES', value: 'send_tts_messages=True' },
  { label: 'MANAGE_MESSAGES', value: 'manage_messages=True' },
  { label: 'EMBED_LINKS', value: 'embed_links=True' },
  { label: 'ATTACH_FILES', value: 'attach_files=True' },
  { label: 'READ_MESSAGE_HISTORY', value: 'read_message_history=True' },
  { label: 'MENTION_EVERYONE', value: 'mention_everyone=True' },
  { label: 'USE_EXTERNAL_EMOJIS', value: 'use_external_emojis=True' },
  { label: 'VIEW_GUILD_INSIGHTS', value: 'view_guild_insights=True' },
  { label: 'CONNECT', value: 'connect=True' },
  { label: 'SPEAK', value: 'speak=True' },
  { label: 'MUTE_MEMBERS', value: 'mute_members=True' },
  { label: 'DEAFEN_MEMBERS', value: 'deafen_members=True' },
  { label: 'MOVE_MEMBERS', value: 'move_members=True' },
  { label: 'USE_VAD', value: 'use_vad=True' },
  { label: 'CHANGE_NICKNAME', value: 'change_nickname=True' },
  { label: 'MANAGE_NICKNAMES', value: 'manage_nicknames=True' },
  { label: 'MANAGE_ROLES', value: 'manage_roles=True' },
  { label: 'MANAGE_WEBHOOKS', value: 'manage_webhooks=True' },
  { label: 'MANAGE_GUILD_EXPRESSIONS', value: 'manage_guild_expressions=True' },
  { label: 'USE_APPLICATION_COMMANDS', value: 'use_application_commands=True' },
  { label: 'REQUEST_TO_SPEAK', value: 'request_to_speak=True' },
  { label: 'MANAGE_EVENTS', value: 'manage_events=True' },
  { label: 'MANAGE_THREADS', value: 'manage_threads=True' },
  { label: 'CREATE_PUBLIC_THREADS', value: 'create_public_threads=True' },
  { label: 'CREATE_PRIVATE_THREADS', value: 'create_private_threads=True' },
  { label: 'USE_EXTERNAL_STICKERS', value: 'use_external_stickers=True' },
  { label: 'SEND_MESSAGES_IN_THREADS', value: 'send_messages_in_threads=True' },
  { label: 'USE_EMBEDDED_ACTIVITIES', value: 'use_embedded_activities=True' },
  { label: 'MODERATE_MEMBERS', value: 'moderate_members=True' },
  { label: 'VIEW_CREATOR_MONETIZATION_ANALYTICS', value: 'view_creator_monetization_analytics=True' },
  { label: 'USE_SOUNDBOARD', value: 'use_soundboard=True' },
  { label: 'CREATE_GUILD_EXPRESSIONS', value: 'create_guild_expressions=True' },
  { label: 'CREATE_EVENTS', value: 'create_events=True' },
  { label: 'USE_EXTERNAL_SOUNDS', value: 'use_external_sounds=True' },
  { label: 'SEND_VOICE_MESSAGES', value: 'send_voice_messages=True' },
  { label: 'SEND_POLLS', value: 'send_polls=True' },
  { label: 'USE_EXTERNAL_APPS', value: 'use_external_apps=True' },
];

export default function CommandBuilder() {
  const { loggedIn, username } = useAuth();
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [permission, setPermission] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!loggedIn) {
      setError("Please log in to generate commands.");
      return;
    }

    try {
      const response = await axios.post<{ code: string }>('http://localhost:8000/generate-command/', {
        name,
        desc,
        permission,
      });
      setPreview(response.data.code);
      setError(null);
    } catch (error) {
      console.error('Error generating command:', error);
      setError("Failed to generate command. Please try again.");
    }
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPermission(Array.from(e.target.selectedOptions, option => option.value));
  };

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold">Please log in to access the Command Builder.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-background text-text"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Command Builder</h1>
        <form>
          <div className="mb-4">
            <label className="block mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Description:</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="input"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Permission:</label>
            <select
              multiple
              value={permission}
              onChange={handlePermissionChange}
              className="input"
            >
              {permissionsList.map((perm) => (
                <option key={perm.value} value={perm.value}>{perm.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="btn w-full"
          >
            Generate
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {preview && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Command Preview:</h2>
            <pre className="bg-gray-100 p-4 rounded dark:bg-gray-800 dark:text-gray-200 overflow-x-auto">
              {preview}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}