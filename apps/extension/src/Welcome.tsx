import React from 'react';
import ReactDOM from 'react-dom/client';
import { SOCIAL_MEDIA_LINKS } from '@/constants/social-media';
import { Button } from '@/components/ui/button';
import ElytroIcon from '@/assets/logo.svg';
import '@/index.css';
import { openSidePanel } from './utils/window';

const SocialMediaIcon: React.FC<{
  name: string;
  url: string;
  icon: string;
}> = ({ name, url, icon }) => {
  return (
    <a key={name} href={url} target="_blank" rel="noreferrer">
      <img src={icon} alt={name} className="w-6 h-6" />
    </a>
  );
};

const Welcome = () => (
  <div className="w-screen h-screen elytro-horizontal-gradient-bg flex flex-col items-center justify-center">
    <header className="fixed top-4 left-4 elytro-text-subtitle flex items-center gap-3xs">
      <img src={ElytroIcon} alt="Elytro" className="size-xl" />
      Elytro
    </header>
    <main className="rounded-sm p-4xl bg-white w-[480px]">
      <h1 className="elytro-text-headline mb-lg ">Welcome to Elytro</h1>
      <p className="elytro-text-body opacity-60">
        Set up or import your smart contract wallets to start exploring
        Ethereum.
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
