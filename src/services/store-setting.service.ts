import { StoreSettingRepository } from "@/repositories/store-setting.repository";
import { prisma } from "@/lib/prisma";

export const StoreSettingService = {
  async getSetting(key: string): Promise<string | null> {
    return StoreSettingRepository.getValue(key);
  },

  async updateSetting(key: string, value: string, group: string, userId: string) {
    const oldValue = await StoreSettingRepository.getValue(key);
    const updated = await StoreSettingRepository.setValue(key, value, group);

    // Track setting update in AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: "STORE_SETTING_UPDATE",
        details: `Updated store setting '${key}' in group '${group}' from '${oldValue || "none"}' to '${value}'`,
      },
    });

    return updated;
  },

  async getSettingsByGroup(group: string) {
    return StoreSettingRepository.findManyByGroup(group);
  },

  async getAllSettings() {
    return StoreSettingRepository.findAll();
  },

  async bulkUpdate(settings: Record<string, { value: string; group: string }>, userId: string) {
    const results = [];
    for (const [key, item] of Object.entries(settings)) {
      const result = await this.updateSetting(key, item.value, item.group, userId);
      results.push(result);
    }
    return results;
  },
};
