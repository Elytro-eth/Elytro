import React from 'react';
import ReactDOM from 'react-dom/client';
import { SOCIAL_MEDIA_LINKS } from '@/constants/social-media';
import { Button } from '@/components/ui/button';
import ElytroIcon from '@/assets/logo.svg';
import '@/index.css';
import { openSidePanel } from './utils/window';
import { ArrowUp } from 'lucide-react';

const SocialMediaIcon: React.FC<{
  name: string;
  url: string;
  icon: string;
}> = ({ name, url, icon }) => {
  return (
    <a key={name} href={url} target="_blank" rel="noreferrer">
      <img src={icon} alt={name} className="w-6 h-6 hover:opacity-80" />
    </a>
  );
};

const Welcome = () => (
  <div className="w-screen h-screen elytro-horizontal-gradient-bg flex flex-col items-center justify-center">
    <header className="fixed top-4 left-4 elytro-text-subtitle flex items-center gap-3xs">
      <img src={ElytroIcon} alt="Elytro" className="size-2xl" />
      Elytro
    </header>
    <div className="absolute top-4 right-8 elytro-text-small text-gray-600 flex items-top gap-2">
      <ArrowUp className="w-5 h-5 stroke-gray-600" />
      Open Extensions and pin <br />
      Elytro for easy access
    </div>
    <main className="rounded-sm p-4xl bg-white w-[480px]">
      <h1 className="elytro-text-headline mb-lg ">Welcome to Elytro</h1>
      <p className="elytro-text-body text-gray-600">
        Your first smart contract wallet for Ethereum
      </p>

      <Button
        className="w-full mt-2xl"
        onClick={() =>
          openSidePanel(() => {
            window.close();
          })
        }
      >
        Launch Elytro
      </Button>
    </main>
    <footer className="flex gap-4 items-center mt-6">
      {SOCIAL_MEDIA_LINKS.map(({ name, url, icon }) => (
        <SocialMediaIcon key={name} name={name} url={url} icon={icon} />
      ))}
    </footer>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Welcome />
  </React.StrictMode>
);
