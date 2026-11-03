import { Delivery } from "../models/Delivery.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
export class AddressController {
  constructor(users) {
    this.users = users;
  }
  list(req, res) {
    return ApiResponseView.send(res, {
      data: req.addressBook || [],
      message: "Endereços de demonstração da sua conta.",
    });
  }
  async change(req, res, type) {
    const address = ["create", "edit"].includes(type)
      ? Delivery.address(req.body)
      : undefined;
    const data = await this.users.updateAddressBook(req.user.id, {
      type,
      id: req.params.id,
      address,
    });
    return ApiResponseView.send(res, {
      data,
      message: "Endereços atualizados.",
    });
  }
}
