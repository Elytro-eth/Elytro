import React from 'react';

interface IProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  // allSteps?: number;
  // currentStep?: number;
}

export default function ContentWrapper({
  children,
  title,
  subtitle,
  // allSteps,
  // currentStep,
}: IProps) {
  return (
    <section className="max-w-xl w-[36rem] bg-white rounded-lg min-h-fit px-4xl py-3xl inline-block">
      {title && <h1 className="text-title text-left mb-md">{title}</h1>}
      {subtitle && <h2 className="text-gray-600 mb-lg text-left">{subtitle}</h2>}
      {children}
    </section>
  );
}
