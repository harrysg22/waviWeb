import { motion } from "motion/react";
import { ReactNode } from "react";

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  delay?: number;
}

export function StepCard({ number, title, description, icon, delay = 0 }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-500/30">
        {number}
      </div>

      <div className="bg-white rounded-3xl p-8 pt-12 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
          {icon}
        </div>

        <h3 className="text-2xl mb-3 text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
