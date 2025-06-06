import { randomUUID } from 'node:crypto';
import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { z } from 'zod';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { schema } from '../db/schema/index.ts';
import { db } from '../db/client.ts';
import { dispatchOrderCreated } from '../broker/messages/order-created.ts';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: '*' });

app.get('/health', () => {
  return 'OK';
});

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.number(),
    }),
  },
}, async (request, reply) => {
  const { amount } = request.body;

  console.log('Creating order with amount ', amount);

  const orderId = randomUUID();
  dispatchOrderCreated({
    orderId,
    amount,
    customer: {
      id: 'f3b7567c-8081-486e-b740-edbe375208f3',
    },
  })

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: 'f3b7567c-8081-486e-b740-edbe375208f3',
    amount,
  });
  
  return reply.status(201).send();
});

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[Orders] HTTP Server running!');
});
