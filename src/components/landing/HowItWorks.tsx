'use client';

const steps = [
  {
    icon: '🔍',
    title: 'Browse tournaments',
    description: 'Filter by location, rating, and tournament type.',
  },
  {
    icon: '📝',
    title: 'Register instantly',
    description: 'Secure online registration with all details in one place.',
  },
  {
    icon: '♟️',
    title: 'Show up and play',
    description: 'Receive confirmations and reminders before game day.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Getting into your next tournament is easy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



