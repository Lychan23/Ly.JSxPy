"use client"
import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Shield, Cloud, Zap, Database, Bot, Terminal, Code, Globe, Cpu, Settings, Users, Lock, LucideIcon } from 'lucide-react';

interface Section {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: LucideIcon;
  title: string;
  id: SectionId;
}

type SectionId = 
  | 'reliable' 
  | 'design' 
  | 'ease' 
  | 'cloud' 
  | 'security' 
  | 'ai' 
  | 'discord' 
  | 'json' 
  | 'sqlite' 
  | 'global' 
  | 'team' 
  | 'analytics';

const sections: Section[] = [
  {
    title: "Core Features",
    items: [
      { icon: Shield, title: "Reliability & Performance", id: "reliable" },
      { icon: Zap, title: "Futuristic Design", id: "design" },
      { icon: Terminal, title: "User Experience", id: "ease" },
      { icon: Cloud, title: "Cloud Architecture", id: "cloud" },
      { icon: Lock, title: "Security & Privacy", id: "security" }
    ]
  },
  {
    title: "Key Systems",
    items: [
      { icon: Cpu, title: "AI Management", id: "ai" },
      { icon: Bot, title: "Discord Integration", id: "discord" },
      { icon: Database, title: "JSON System", id: "json" },
      { icon: Code, title: "SQLite Integration", id: "sqlite" }
    ]
  },
  {
    title: "Advanced Features",
    items: [
      { icon: Globe, title: "Global Distribution", id: "global" },
      { icon: Users, title: "Team Collaboration", id: "team" },
      { icon: Settings, title: "System Analytics", id: "analytics" }
    ]
  }
];

const sectionContent: Record<SectionId, string> = {
  reliable: "Experience unmatched reliability with our enterprise-grade infrastructure, delivering 99.99% uptime and real-time performance monitoring.",
  design: "Immerse yourself in a cutting-edge interface that combines aesthetic excellence with practical functionality.",
  ease: "Navigate complex operations with intuitive controls and smart automation features that streamline your workflow.",
  cloud: "Scale seamlessly with our cloud-native architecture, automatically adjusting resources based on demand.",
  security: "Rest assured with military-grade encryption, regular security audits, and comprehensive privacy controls.",
  ai: "Leverage advanced AI capabilities with our intuitive management interface and automated optimization systems.",
  discord: "Manage multiple Discord bots efficiently with our unified dashboard and automated deployment pipeline.",
  json: "Experience lightning-fast data operations with our optimized JSON handling system and built-in validation.",
  sqlite: "Secure your data with our robust SQLite implementation featuring parameterized queries and automatic backups.",
  global: "Deploy globally with our distributed network infrastructure, ensuring optimal performance worldwide.",
  team: "Enable seamless team collaboration with real-time updates, role-based access control, and audit logging.",
  analytics: "Gain deep insights into your system's performance with comprehensive analytics and custom reporting."
};

const DocumentationPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<SectionId | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: SectionId) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-48 bg-[#2a2b4a] rounded-lg"></div>
          <div className="h-6 w-32 bg-[#2a2b4a] rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-gray-100 font-['Space_Grotesk']">
      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#1a1b3e] rounded-lg hover:bg-[#2a2b4a] transition-all duration-300 shadow-lg shadow-cyan-500/20"
      >
        {sidebarOpen ? <X className="text-cyan-400" size={24} /> : <Menu className="text-cyan-400" size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#1a1b3e] transform transition-transform duration-500 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } z-40 shadow-lg shadow-cyan-500/20`}>
        <div className="p-6 pt-16 space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm uppercase tracking-wider text-cyan-400 font-['Orbitron'] font-semibold">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white'
                        : 'hover:bg-[#2a2b4a] text-gray-300'
                    } group`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${
                      activeSection === item.id ? 'text-cyan-300' : 'text-gray-400'
                    }`} />
                    <span className="font-['Inter']">{item.title}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                      activeSection === item.id ? 'translate-x-1 opacity-100' : 'opacity-0'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-500 ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <div className="max-w-4xl mx-auto p-8 pt-20">
          <h1 className="text-5xl font-['Orbitron'] font-bold mb-8 text-white">
            Documentation
          </h1>

          {/* Interactive Feature Cards */}
          {sections.map((section) => (
            <div key={section.title} className="mb-16">
              <h2 className="text-2xl font-['Orbitron'] font-semibold mb-8 text-white">
                {section.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {section.items.map((item) => (
                  <section
                    key={item.id}
                    id={item.id}
                    className="group bg-[#1a1b3e] p-6 rounded-xl border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <div className="flex items-center mb-4">
                      <item.icon className="w-6 h-6 text-cyan-400 mr-3" />
                      <h3 className="text-xl font-['Space_Grotesk'] font-semibold text-white">
                        {item.title}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-white font-['Inter'] leading-relaxed">
                        {sectionContent[item.id]}
                      </p>
                      <div className="flex items-center space-x-4 pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="px-4 py-2 bg-cyan-500/20 text-white rounded-lg hover:bg-cyan-500/30 transition-colors duration-300 font-['Space_Grotesk']">
                          Learn More
                        </button>
                        <button className="px-4 py-2 bg-purple-500/20 text-white rounded-lg hover:bg-purple-500/30 transition-colors duration-300 font-['Space_Grotesk']">
                          View Demo
                        </button>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Floating Button */}
      <button
        onClick={() => scrollToSection('reliable')}
        className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75 transition-all duration-300 group"
      >
        <ChevronRight className="w-6 h-6 transform -rotate-90 group-hover:scale-110 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default DocumentationPage;