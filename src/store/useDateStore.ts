import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DateState {
  month: number; // 1-12
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
}

export const useDateStore = create<DateState>()(
  persist(
    (set) => {
      const today = new Date();
      return {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        setMonth: (month) => set({ month }),
        setYear: (year) => set({ year }),
      };
    },
    {
      name: "comitrack-date",
      skipHydration: true,
    }
  )
);
