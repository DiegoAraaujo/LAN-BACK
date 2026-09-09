import { CustomersController } from "./CustomersController.js";
import CustomersRepository from "./CustomersRepository.js";
import { CreateCustomer } from "./services/CreateCustomer.js";
import { RemoveCustomer } from "./services/RemoveCustomer.js";
import { ListCustomers } from "./services/ListCustomers.js";
import { UpdateCustomer } from "./services/UpdateCustomer.js";
import { GetCustomerDashboard } from "./services/GetCustomerDashboard.js";
import { GetCustomerLoyaltyReport } from "./services/GetCustomerLoyaltyReport.js";

const customerRepository = new CustomersRepository();

const createCustomer = new CreateCustomer(customerRepository);
const removeCustomer = new RemoveCustomer(customerRepository);
const listCustomers = new ListCustomers(customerRepository);
const updateCustomer = new UpdateCustomer(customerRepository);
const getCustomerDashboard = new GetCustomerDashboard(customerRepository);
const getCustomerLoyaltyReport = new GetCustomerLoyaltyReport(customerRepository);

export const customersController = new CustomersController(
  createCustomer,
  listCustomers,
  removeCustomer,
  updateCustomer,
  getCustomerDashboard,
  getCustomerLoyaltyReport,
);

export default customerRepository;
