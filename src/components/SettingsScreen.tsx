import { useState } from 'react';
import { ArrowLeft, User, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { UserSettings, UserAccount } from '../App';

interface SettingsScreenProps {
  settings: UserSettings;
  account: UserAccount;
  onSave: (settings: UserSettings) => void;
  onCancel: () => void;
  onCreateAccount?: () => void;
}

const AGE_RANGES = [
  '60-64',
  '65-69',
  '70-74',
  '75-79',
  '80-84',
  '85-89',
  '90+'
];

export function SettingsScreen({ settings, account, onSave, onCancel, onCreateAccount }: SettingsScreenProps) {
  const [defaultAnonymous, setDefaultAnonymous] = useState(settings.defaultAnonymous);
  const [ageRange, setAgeRange] = useState(settings.ageRange);
  const [city, setCity] = useState(settings.city);

  const handleSave = () => {
    onSave({
      defaultAnonymous,
      ageRange,
      city
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onCancel}
          className="p-3 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
        </button>
        <h2 className="flex-1 text-center text-amber-900 -ml-12">Settings</h2>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-amber-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 mb-1">Account Status</h3>
              <p className="text-amber-800/70">
                {account.isAnonymous ? 'Anonymous User' : 'Registered Account'}
              </p>
            </div>
          </div>
          {!account.isAnonymous && account.email ? (
            <div className="flex items-center gap-3 pt-3 border-t border-amber-200">
              <Mail className="w-5 h-5 text-amber-700" />
              <p className="text-amber-800">{account.email}</p>
            </div>
          ) : null}
          {account.isAnonymous && onCreateAccount ? (
            <Button
              onClick={onCreateAccount}
              variant="outline"
              className="w-full mt-4 h-12 border-2 border-amber-500 text-amber-900 hover:bg-amber-50"
            >
              Create an Account
            </Button>
          ) : null}
        </div>

        {/* Anonymous Toggle */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-amber-900 mb-2">Default to Anonymous</h3>
              <p className="text-amber-800/70">
                Publish stories anonymously by default
              </p>
            </div>
            <Switch
              checked={defaultAnonymous}
              onCheckedChange={setDefaultAnonymous}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <label className="block text-amber-900 mb-3">Your Age Range</label>
          <Select value={ageRange} onValueChange={setAgeRange}>
            <SelectTrigger className="h-14 bg-white border-2 border-amber-200">
              <SelectValue placeholder="Select your age range" />
            </SelectTrigger>
            <SelectContent>
              {AGE_RANGES.map(range => (
                <SelectItem key={range} value={range} className="py-3">
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <label className="block text-amber-900 mb-3">Your City</label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-14 bg-white border-2 border-amber-200 focus:border-amber-600"
            placeholder="Enter your city"
          />
        </div>

        {/* Info Box */}
        <div className="bg-amber-100 rounded-xl p-5 border-2 border-amber-300">
          <p className="text-amber-900">
            💡 Your personal information helps other listeners connect with your stories, but you can always choose to remain anonymous when sharing.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
