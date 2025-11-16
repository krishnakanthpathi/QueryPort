import React from 'react';
import CardNav from './components/CardNav';
import logo from './assets/react.svg';

interface NavLink {
  label: string;
  ariaLabel: string;
  href: string;
}

interface NavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: NavLink[];
}

const App: React.FC = () => {
  const items: NavItem[] = [
    {
      label: "Contact",
      bgColor: "#000", 
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us", href: "mailto:info@example.com" },
        { label: "Twitter", ariaLabel: "Twitter", href: "https://twitter.com/YourHandle" },
        { label: "LinkedIn", ariaLabel: "LinkedIn", href: "https://www.linkedin.com/company/your-company" }
      ]
    }
  ];

  return (
    <CardNav
      logo={logo}
      logoAlt="Company Logo"
      items={items}
      baseColor="#fff"
      menuColor="#000"
      buttonBgColor="#111"
      buttonTextColor="#fff"
      ease="power3.out"
    />
  );
};

export default App;