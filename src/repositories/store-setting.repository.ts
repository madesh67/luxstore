import { prisma } from "@/lib/prisma";

export const StoreSettingRepository = {
  /**
   * Get value of a store configuration key.
   */
  async getValue(key: string): Promise<string | null> {
    const setting = await prisma.storeSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : null;
  },

  /**
   * Set or update value of a store configuration key.
   */
  async setValue(key: string, value: string, group: string) {
    return prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        group: group.toUpperCase(),
      },
    });
  },

  /**
   * Find settings grouped under a specific operations section.
   */
  async findManyByGroup(group: string) {
    return prisma.storeSetting.findMany({
      where: {
        group: group.toUpperCase(),
      },
    });
  },

  /**
   * Retrieve all store settings mapping.
   */
  async findAll() {
    const list = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = {};
    list.forEach((item) => {
      settingsMap[item.key] = item.value;
    });
    return settingsMap;
  },
};
