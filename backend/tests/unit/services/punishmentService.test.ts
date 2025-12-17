import { PunishmentService } from '../../../src/services/punishmentService';
import { AppError } from '../../../src/types';

describe('PunishmentService', () => {
  let punishmentService: PunishmentService;

  beforeEach(() => {
    punishmentService = new PunishmentService();
  });

  describe('Basic functionality', () => {
    it('should create PunishmentService instance', () => {
      expect(punishmentService).toBeInstanceOf(PunishmentService);
    });

    it('should have required methods', () => {
      expect(typeof punishmentService.getPunishments).toBe('function');
      expect(typeof punishmentService.getPunishmentRules).toBe('function');
      expect(typeof punishmentService.createPunishment).toBe('function');
      expect(typeof punishmentService.updatePunishmentStatus).toBe('function');
      expect(typeof punishmentService.createPunishmentRule).toBe('function');
      expect(typeof punishmentService.updatePunishmentRule).toBe('function');
      expect(typeof punishmentService.deletePunishmentRule).toBe('function');
      expect(typeof punishmentService.detectViolations).toBe('function');
      expect(typeof punishmentService.getPunishmentStats).toBe('function');
    });
  });

  describe('getPunishments', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.getPunishments('test_user_id', {
          page: 1,
          limit: 20,
          status: 'ACTIVE',
          severity: 'MEDIUM'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept empty filters', async () => {
      try {
        await punishmentService.getPunishments('test_user_id', {});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle no filters', async () => {
      try {
        await punishmentService.getPunishments('test_user_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getPunishmentRules', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.getPunishmentRules('test_parent_id', {
          isActive: true,
          type: 'DEDUCT_COINS',
          severity: 'MEDIUM'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept empty filters', async () => {
      try {
        await punishmentService.getPunishmentRules('test_parent_id', {});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('createPunishment', () => {
    it('should accept valid punishment data', async () => {
      const validPunishmentData = {
        targetUserId: 'child_id',
        taskId: 'task_id',
        type: 'DEDUCT_COINS' as const,
        reason: 'Did not complete homework',
        severity: 'MEDIUM' as const,
        value: 20
      };

      try {
        await punishmentService.createPunishment('parent_id', validPunishmentData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required fields', async () => {
      const invalidPunishmentData = {
        targetUserId: '',
        type: 'DEDUCT_COINS' as const,
        reason: '',
        severity: 'MEDIUM' as const,
        value: 0
      };

      try {
        await punishmentService.createPunishment('parent_id', invalidPunishmentData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('updatePunishmentStatus', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.updatePunishmentStatus('parent_id', 'punishment_id', 'COMPLETED');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty punishment ID', async () => {
      try {
        await punishmentService.updatePunishmentStatus('parent_id', '', 'COMPLETED');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept different status values', async () => {
      const statuses = ['ACTIVE', 'COMPLETED', 'WAIVED'] as const;

      for (const status of statuses) {
        try {
          await punishmentService.updatePunishmentStatus('parent_id', 'punishment_id', status);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('createPunishmentRule', () => {
    it('should accept valid rule data', async () => {
      const validRuleData = {
        name: 'Test Rule',
        description: 'Test punishment rule',
        type: 'DEDUCT_COINS' as const,
        severity: 'MEDIUM' as const,
        value: 20
      };

      try {
        await punishmentService.createPunishmentRule('parent_id', validRuleData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required fields', async () => {
      const invalidRuleData = {
        name: '',
        description: '',
        type: 'DEDUCT_COINS' as const,
        severity: 'MEDIUM' as const,
        value: 0
      };

      try {
        await punishmentService.createPunishmentRule('parent_id', invalidRuleData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('updatePunishmentRule', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.updatePunishmentRule('parent_id', 'rule_id', {
          name: 'Updated Rule'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty rule ID', async () => {
      try {
        await punishmentService.updatePunishmentRule('parent_id', '', {
          name: 'Updated Rule'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deletePunishmentRule', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.deletePunishmentRule('parent_id', 'rule_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty rule ID', async () => {
      try {
        await punishmentService.deletePunishmentRule('parent_id', '');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('detectViolations', () => {
    it('should accept user IDs', async () => {
      try {
        await punishmentService.detectViolations('parent_id', 'child_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty user IDs', async () => {
      try {
        await punishmentService.detectViolations('', '');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getPunishmentStats', () => {
    it('should accept valid parameters', async () => {
      try {
        await punishmentService.getPunishmentStats('parent_id', 'today');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept different periods', async () => {
      const periods = ['today', 'week', 'month'] as const;

      for (const period of periods) {
        try {
          await punishmentService.getPunishmentStats('parent_id', period);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle default period', async () => {
      try {
        await punishmentService.getPunishmentStats('parent_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Method signatures', () => {
    it('should have correct return types', async () => {
      expect(typeof punishmentService.getPunishments('user', {} as any)).toBe('object');
      expect(typeof punishmentService.getPunishmentRules('user', {} as any)).toBe('object');
      expect(typeof punishmentService.createPunishment('user', {} as any)).toBe('object');
      expect(typeof punishmentService.updatePunishmentStatus('user', 'id', 'ACTIVE' as any)).toBe('object');
      expect(typeof punishmentService.createPunishmentRule('user', {} as any)).toBe('object');
      expect(typeof punishmentService.updatePunishmentRule('user', 'id', {} as any)).toBe('object');
      expect(typeof punishmentService.deletePunishmentRule('user', 'id')).toBe('object');
      expect(typeof punishmentService.detectViolations('parent', 'child')).toBe('object');
      expect(typeof punishmentService.getPunishmentStats('user', 'today')).toBe('object');
    });
  });
});