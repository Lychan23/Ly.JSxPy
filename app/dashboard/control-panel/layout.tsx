interface LayoutProps {
    children: React.ReactNode;
  }
  
  export default function ControlPanelLayout({ children }: LayoutProps) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }
  