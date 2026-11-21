import { describe, it, expect, vi } from "vitest";
import { assignOwnerToOrphanGeneralSales, countOrphanGeneralSales } from "@/lib/assign-general-sales-owner";

function fakeClient(count: number) {
  return {
    generalSalesMonthly: {
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
  };
}

describe("assignOwnerToOrphanGeneralSales", () => {
  it("assigns the owner to the general sales months without owner and returns how many it fixed", async () => {
    const client = fakeClient(7);

    const result = await assignOwnerToOrphanGeneralSales(client as never, "owner-1");

    expect(result.corrected).toBe(7);
    expect(client.generalSalesMonthly.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "owner-1" } })
    );
  });

  it("only writes the owner: gross volume, target, units goals and company units are left out of the update", async () => {
    const client = fakeClient(7);

    await assignOwnerToOrphanGeneralSales(client as never, "owner-1");

    const { data } = client.generalSalesMonthly.updateMany.mock.calls[0][0];
    expect(Object.keys(data)).toEqual(["userId"]);
  });

  it("when there is nothing to fix, returns 0 and says there was nothing to correct", async () => {
    const client = fakeClient(0);

    const result = await assignOwnerToOrphanGeneralSales(client as never, "owner-1");

    expect(result.corrected).toBe(0);
    expect(result.message).toBe("No había nada para corregir.");
  });

  it("only touches general sales months without owner, never overwrites an existing one", async () => {
    const client = fakeClient(0);

    await assignOwnerToOrphanGeneralSales(client as never, "owner-1");

    expect(client.generalSalesMonthly.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: null } })
    );
  });
});

describe("countOrphanGeneralSales", () => {
  it("counts the general sales months without owner and writes nothing", async () => {
    const client = {
      generalSalesMonthly: {
        count: vi.fn().mockResolvedValue(7),
        updateMany: vi.fn(),
      },
    };

    const result = await countOrphanGeneralSales(client as never);

    expect(result).toBe(7);
    expect(client.generalSalesMonthly.count).toHaveBeenCalledWith({ where: { userId: null } });
    expect(client.generalSalesMonthly.updateMany).not.toHaveBeenCalled();
  });
});
