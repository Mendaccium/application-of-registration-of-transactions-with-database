// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });
    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });
    }
    await categoryRepository.save(transactionCategory);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid!');
    }
    if (['outcome'].includes(type)) {
      const balance = await transactionsRepository.getBalance();
      if (value > balance.total) {
        throw new AppError('Error, insufficient balance');
      }
    }
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
