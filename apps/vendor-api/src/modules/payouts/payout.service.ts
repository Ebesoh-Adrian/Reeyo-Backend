// apps/vendor-api/src/modules/payouts/payouts.service.ts
import { PayoutService } from '../../../../../libs/wallet-engine/payout.service';
import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';
import { AppError } from '../../middleware/error.middleware';

export class PayoutsService {
  private payoutService: PayoutService;
  private walletRepo: WalletRepository;

  constructor() {
    this.payoutService = new PayoutService();
    this.walletRepo = new WalletRepository();
  }

  async requestPayout(vendorId: string, data: any) {
    const wallet = await this.walletRepo.getBalance('VENDOR', vendorId);
    if (!wallet || wallet.availableBalance < data.amount) {
      throw new AppError('Insufficient balance', 400, 'WALLET_7000');
    }

    return await this.payoutService.createPayoutRequest(vendorId, data.amount, data.bankDetails);
  }

  async getPayouts(vendorId: string) {
    const result = await this.walletRepo.getPayoutRequests('VENDOR', vendorId);
    return result.payouts;
  }

  async getPayout(vendorId: string, payoutId: string) {
    const payout = await this.walletRepo.getPayoutRequest(payoutId);
    if (!payout || payout.entityId !== vendorId) {
      throw new AppError('Payout not found', 404, 'NOT_FOUND');
    }
    return payout;
  }
}

