import { describe, it, expect, vi } from "vitest";
import { assignOwnerToOrphanPurchases, countOrphanPurchases } from "@/lib/assign-purchase-owner";

function fakeClient(count: number) {
  return {
    devicePurchase: {
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
  };
}

describe("assignOwnerToOrphanPurchases", () => {
  it("assigns the owner to the purchases without owner and returns how many it fixed", async () => {
    const client = fakeClient(17);

    const result = await assignOwnerToOrphanPurchases(client as never, "owner-1");

    expect(result.corrected).toBe(17);
    expect(client.devicePurchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "owner-1" } })
    );
  });

  it("when there is nothing to fix, returns 0 and says there was nothing to correct", async () => {
    const client = fakeClient(0);

    const result = await assignOwnerToOrphanPurchases(client as never, "owner-1");

    expect(result.corrected).toBe(0);
    expect(result.message).toBe("No había nada para corregir.");
  });

  it("only touches purchases without owner, never overwrites an existing one", async () => {
    const client = fakeClient(0);

    await assignOwnerToOrphanPurchases(client as never, "owner-1");

    expect(client.devicePurchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: null } })
    );
  });
});

describe("countOrphanPurchases", () => {
  it("counts the purchases without owner and writes nothing", async () => {
    const client = {
      devicePurchase: {
        count: vi.fn().mockResolvedValue(17),
        updateMany: vi.fn(),
      },
    };

    const result = await countOrphanPurchases(client as never);

    expect(result).toBe(17);
    expect(client.devicePurchase.count).toHaveBeenCalledWith({ where: { userId: null } });
    expect(client.devicePurchase.updateMany).not.toHaveBeenCalled();
  });
});
