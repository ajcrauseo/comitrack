import { describe, it, expect, vi } from "vitest";
import { assignOwnerToOrphanDeviceSales, countOrphanDeviceSales } from "@/lib/assign-device-sales-owner";

function fakeClient(count: number) {
  return {
    deviceSalesMonthly: {
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
  };
}

describe("assignOwnerToOrphanDeviceSales", () => {
  it("assigns the owner to the device sales months without owner and returns how many it fixed", async () => {
    const client = fakeClient(9);

    const result = await assignOwnerToOrphanDeviceSales(client as never, "owner-1");

    expect(result.corrected).toBe(9);
    expect(client.deviceSalesMonthly.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "owner-1" } })
    );
  });

  it("when there is nothing to fix, returns 0 and says there was nothing to correct", async () => {
    const client = fakeClient(0);

    const result = await assignOwnerToOrphanDeviceSales(client as never, "owner-1");

    expect(result.corrected).toBe(0);
    expect(result.message).toBe("No había nada para corregir.");
  });

  it("only touches device sales months without owner, never overwrites an existing one", async () => {
    const client = fakeClient(0);

    await assignOwnerToOrphanDeviceSales(client as never, "owner-1");

    expect(client.deviceSalesMonthly.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: null } })
    );
  });
});

describe("countOrphanDeviceSales", () => {
  it("counts the device sales months without owner and writes nothing", async () => {
    const client = {
      deviceSalesMonthly: {
        count: vi.fn().mockResolvedValue(9),
        updateMany: vi.fn(),
      },
    };

    const result = await countOrphanDeviceSales(client as never);

    expect(result).toBe(9);
    expect(client.deviceSalesMonthly.count).toHaveBeenCalledWith({ where: { userId: null } });
    expect(client.deviceSalesMonthly.updateMany).not.toHaveBeenCalled();
  });
});
