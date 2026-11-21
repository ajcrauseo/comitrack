import { describe, it, expect, vi } from "vitest";
import { assignOwnerToOrphanRepairs, countOrphanRepairs } from "@/lib/assign-repair-owner";

function fakeClient(count: number) {
  return {
    technicalService: {
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
  };
}

describe("assignOwnerToOrphanRepairs", () => {
  it("assigns the owner to the repairs without owner and returns how many it fixed", async () => {
    const client = fakeClient(212);

    const result = await assignOwnerToOrphanRepairs(client as never, "owner-1");

    expect(result.corrected).toBe(212);
    expect(client.technicalService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "owner-1" } })
    );
  });

  it("when there is nothing to fix, returns 0 and says there was nothing to correct", async () => {
    const client = fakeClient(0);

    const result = await assignOwnerToOrphanRepairs(client as never, "owner-1");

    expect(result.corrected).toBe(0);
    expect(result.message).toBe("No había nada para corregir.");
  });

  it("only touches repairs without owner, never overwrites an existing one", async () => {
    const client = fakeClient(0);

    await assignOwnerToOrphanRepairs(client as never, "owner-1");

    expect(client.technicalService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: null } })
    );
  });
});

describe("countOrphanRepairs", () => {
  it("counts the repairs without owner and writes nothing", async () => {
    const client = {
      technicalService: {
        count: vi.fn().mockResolvedValue(212),
        updateMany: vi.fn(),
      },
    };

    const result = await countOrphanRepairs(client as never);

    expect(result).toBe(212);
    expect(client.technicalService.count).toHaveBeenCalledWith({ where: { userId: null } });
    expect(client.technicalService.updateMany).not.toHaveBeenCalled();
  });
});
