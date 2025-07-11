import { supabase } from '../lib/supabase';
import { Test, Offer, FinancialData, Transaction } from '../types';

// Offers Service
export const offersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(offer: Omit<Offer, 'id' | 'createdAt'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .insert({
        user_id: user.id,
        name: offer.name,
        library_link: offer.libraryLink,
        landing_page_link: offer.landingPageLink,
        checkout_link: offer.checkoutLink,
        niche: offer.niche
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      libraryLink: data.library_link,
      landingPageLink: data.landing_page_link,
      checkoutLink: data.checkout_link,
      niche: data.niche,
      createdAt: data.created_at
    } as Offer;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Tests Service
export const testsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(test => ({
      id: test.id,
      startDate: test.start_date,
      productName: test.product_name,
      niche: test.niche,
      offerSource: test.offer_source,
      landingPageUrl: test.landing_page_url,
      investedAmount: test.invested_amount,
      clicks: test.clicks,
      returnValue: test.return_value,
      cpa: test.cpa,
      roi: test.roi,
      roas: test.roas,
      status: test.status,
      observations: test.observations,
      createdAt: test.created_at,
      offerId: test.offer_id
    })) as Test[];
  },

  async create(test: Omit<Test, 'id' | 'createdAt'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tests')
      .insert({
        user_id: user.id,
        offer_id: test.offerId || null,
        start_date: test.startDate,
        product_name: test.productName,
        niche: test.niche,
        offer_source: test.offerSource,
        landing_page_url: test.landingPageUrl,
        invested_amount: test.investedAmount,
        clicks: test.clicks,
        return_value: test.returnValue,
        cpa: test.cpa,
        roi: test.roi,
        roas: test.roas,
        status: test.status,
        observations: test.observations
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      startDate: data.start_date,
      productName: data.product_name,
      niche: data.niche,
      offerSource: data.offer_source,
      landingPageUrl: data.landing_page_url,
      investedAmount: data.invested_amount,
      clicks: data.clicks,
      returnValue: data.return_value,
      cpa: data.cpa,
      roi: data.roi,
      roas: data.roas,
      status: data.status,
      observations: data.observations,
      createdAt: data.created_at,
      offerId: data.offer_id
    } as Test;
  }
};

// Financial Service
export const financialService = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create initial financial data
      const { data: newData, error: createError } = await supabase
        .from('financial_data')
        .insert({
          user_id: user.id,
          initial_capital: 0,
          current_balance: 0,
          total_investment: 0,
          total_revenue: 0,
          net_profit: 0
        })
        .select()
        .single();

      if (createError) {
        // Check if it's a unique constraint violation (race condition)
        if (createError.code === '23505') {
          // Another process created the record, try to fetch it again
          const { data: existingData, error: fetchError } = await supabase
            .from('financial_data')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (fetchError) throw fetchError;
          
          // Get transactions for the existing record
          const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (transError) throw transError;

          return {
            initialCapital: existingData.initial_capital,
            currentBalance: existingData.current_balance,
            totalInvestment: existingData.total_investment,
            totalRevenue: existingData.total_revenue,
            netProfit: existingData.net_profit,
            transactions: (transactions || []).map(t => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              description: t.description,
              date: t.date,
              testId: t.test_id
            }))
          } as FinancialData;
        }
        throw createError;
      }
      
      return {
        initialCapital: newData.initial_capital,
        currentBalance: newData.current_balance,
        totalInvestment: newData.total_investment,
        totalRevenue: newData.total_revenue,
        netProfit: newData.net_profit,
        transactions: []
      } as FinancialData;
    }

    // Get transactions
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (transError) throw transError;

    return {
      initialCapital: data.initial_capital,
      currentBalance: data.current_balance,
      totalInvestment: data.total_investment,
      totalRevenue: data.total_revenue,
      netProfit: data.net_profit,
      transactions: (transactions || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        testId: t.test_id
      }))
    } as FinancialData;
  },

  async update(financial: Partial<FinancialData>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (financial.initialCapital !== undefined) updateData.initial_capital = financial.initialCapital;
    if (financial.currentBalance !== undefined) updateData.current_balance = financial.currentBalance;
    if (financial.totalInvestment !== undefined) updateData.total_investment = financial.totalInvestment;
    if (financial.totalRevenue !== undefined) updateData.total_revenue = financial.totalRevenue;
    if (financial.netProfit !== undefined) updateData.net_profit = financial.netProfit;

    const { error } = await supabase
      .from('financial_data')
      .upsert({
        user_id: user.id,
        ...updateData
      });

    if (error) throw error;
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        test_id: transaction.testId || null,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      testId: data.test_id
    } as Transaction;
  }
};