import { Construction } from 'lucide-react';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Construction size={40} className="text-navy-500" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">{title}</h2>
        <p className="text-gray-500">Este módulo está en desarrollo.</p>
      </div>
    </div>
  );
}
