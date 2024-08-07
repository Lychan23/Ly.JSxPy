# ai/rl_model.py

import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import numpy as np
import random

class QNetwork(nn.Module):
    def __init__(self):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(1, 24)
        self.fc2 = nn.Linear(24, 24)
        self.fc3 = nn.Linear(24, 2)  # 2 actions: generate query, web scrape

    def forward(self, x):
        x = torch.relu(self.fc1(x)) # this is a comment
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

def select_action(state, epsilon, q_network):
    if np.random.rand() < epsilon:
        return np.random.randint(2)
    else:
        with torch.no_grad():
            return q_network(torch.tensor(state, dtype=torch.float32).unsqueeze(0)).argmax().item()

def optimize_model(memory, q_network, optimizer):
    if len(memory) < 32:
        return
    batch = random.sample(memory, 32)
    states, actions, rewards, next_states, dones = zip(*batch)

    states = torch.tensor(states, dtype=torch.float32).unsqueeze(1)
    actions = torch.tensor(actions, dtype=torch.int64).unsqueeze(1)
    rewards = torch.tensor(rewards, dtype=torch.float32)
    next_states = torch.tensor(next_states, dtype=torch.float32).unsqueeze(1)
    dones = torch.tensor(dones, dtype=torch.bool)

    state_action_values = q_network(states).gather(1, actions)
    next_state_values = q_network(next_states).max(1)[0].detach()
    expected_state_action_values = rewards + (0.99 * next_state_values * (~dones))

    loss = nn.MSELoss()(state_action_values, expected_state_action_values.unsqueeze(1))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
