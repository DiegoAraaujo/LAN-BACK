import type { Request, Response } from "express";
import { CustomerMapper } from "./CustomersMappers.js";

import { CreateCustomer } from "./services/CreateCustomer.js";
import { ListCustomers } from "./services/ListCustomers.js";
import { RemoveCustomer } from "./services/RemoveCustomer.js";
import { UpdateCustomer } from "./services/UpdateCustomer.js";
import {
  createCustomerSchema,
  customerStatusSchema,
  updateCustomerSchema,
} from "./customerSchema.js";
import type { GetCustomerDashboard } from "./services/GetCustomerDashboard.js";
import type { GetCustomerLoyaltyReport } from "./services/GetCustomerLoyaltyReport.js";

export class CustomersController {
  constructor(
    private createCustomer: CreateCustomer,
    private listCustomers: ListCustomers,
    private removeCustomer: RemoveCustomer,
    private updateCustomer: UpdateCustomer,
    private getCustomerDashboard: GetCustomerDashboard,
    private getCustomerLoyaltyReport: GetCustomerLoyaltyReport,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;
    const data = createCustomerSchema.parse(req.body);

    const customer = await this.createCustomer.execute({
      userId,
      ...data,
      contacts: data.contacts ?? [],
    });

    return res.status(201).json(CustomerMapper.toResponse(customer));
  }

  async list(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;

    const status = customerStatusSchema.optional().parse(req.query.status);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const { customers, total } = await this.listCustomers.execute({
      userId,
      page,
      limit,
      search,
      status,
    });

    return res.status(200).json({
      data: customers.map((item) =>
        CustomerMapper.toResponse(item.customer, {
          totalAppointments: item.totalAppointments,
          totalSpent: item.totalSpent,
        }),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const { id } = req.params;

    const userId = req.user.id;
    const data = updateCustomerSchema.parse(req.body);

    const updatedCustomer = await this.updateCustomer.execute({
      id,
      userId,
      ...data,
    });

    return res.json(CustomerMapper.toResponse(updatedCustomer));
  }

  async dashboard(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;

    const dashboard = await this.getCustomerDashboard.execute({
      userId,
    });

    return res.status(200).json(dashboard);
  }

  async loyalty(req: Request, res: Response): Promise<Response> {
    const data = await this.getCustomerLoyaltyReport.execute({ userId: req.user.id });
    return res.status(200).json({ data });
  }

  async remove(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user.id;

    await this.removeCustomer.execute({ id, userId });

    return res.sendStatus(204);
  }
}
