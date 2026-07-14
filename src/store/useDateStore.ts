import { create } from "zustand";

interface DateState {
  month: number; // 1-12
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
}

export const useDateStore = create<DateState>((set) => {
  const today = new Date();
  return {
    month: today.getMonth() + 1, // JS months are 0-11
    year: today.getFullYear(),
    setMonth: (month) => set({ month }),
    setYear: (year) => set({ year }),
  };
});
