import { AddressRepository } from "@/repositories/address.repository";
import { addressSchema, AddressInput } from "@/schemas/address";
import { AppError } from "@/lib/error-handler";

export const AddressService = {
  async getAddresses(userId: string) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }
    return AddressRepository.findManyByUserId(userId);
  },

  async getAddressById(id: string, userId: string) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const address = await AddressRepository.findById(id);

    if (!address || address.userId !== userId) {
      throw new AppError("Address not found or unauthorized", 404, "ADDRESS_NOT_FOUND");
    }

    return address;
  },

  async createAddress(userId: string, input: AddressInput) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const validated = addressSchema.parse(input);
    const fullName = `${validated.firstName} ${validated.lastName}`;

    return AddressRepository.create(userId, {
      fullName,
      phoneNumber: validated.phoneNumber,
      addressLine1: validated.addressLine1,
      addressLine2: validated.addressLine2,
      city: validated.city,
      state: validated.state,
      postalCode: validated.postalCode,
      country: validated.country,
      title: validated.addressType,
      isDefault: validated.isDefault,
    });
  },

  async updateAddress(id: string, userId: string, input: Partial<AddressInput>) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    // Retrieve and check ownership first
    await this.getAddressById(id, userId);

    const fullName = input.firstName && input.lastName 
      ? `${input.firstName} ${input.lastName}`
      : undefined;

    return AddressRepository.update(id, userId, {
      fullName,
      phoneNumber: input.phoneNumber,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      title: input.addressType,
      isDefault: input.isDefault,
    });
  },

  async deleteAddress(id: string, userId: string) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    // Retrieve and check ownership first
    await this.getAddressById(id, userId);

    const deleted = await AddressRepository.delete(id, userId);
    if (!deleted) {
      throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
    }

    return deleted;
  },

  async setDefaultAddress(id: string, userId: string) {
    if (!userId) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    // Retrieve and check ownership first
    await this.getAddressById(id, userId);

    return AddressRepository.setDefault(id, userId);
  },
};
