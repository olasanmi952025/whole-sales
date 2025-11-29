import Router from 'koa-router';
import { PricingRulesController } from '../controllers/pricing-rules.controller.js';
import { RuleLogsController } from '../controllers/rule-logs.controller.js';
import { ProductsController } from '../controllers/products.controller.js';

const router = new Router({ prefix: '/api' });

const pricingRulesController = new PricingRulesController();
const ruleLogsController = new RuleLogsController();
const productsController = new ProductsController();

router.get('/rules', ctx => pricingRulesController.getAll(ctx));
router.get('/rules/:id', ctx => pricingRulesController.getById(ctx));
router.post('/rules', ctx => pricingRulesController.create(ctx));
router.put('/rules/:id', ctx => pricingRulesController.update(ctx));
router.delete('/rules/:id', ctx => pricingRulesController.delete(ctx));
router.post('/rules/calculate', ctx => pricingRulesController.calculate(ctx));

router.get('/logs', ctx => ruleLogsController.getAll(ctx));
router.get('/logs/order/:orderId', ctx => ruleLogsController.getByOrderId(ctx));

router.get('/products', ctx => productsController.getProducts(ctx));
router.get('/collections', ctx => productsController.getCollections(ctx));

export default router;

