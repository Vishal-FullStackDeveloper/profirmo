'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import RatingStars from '@/components/common/RatingStars';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/common/Avatar';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES, PROFESSION_TYPES, SPECIALIZATIONS } from '@/utils/constants';
import { formatRate } from '@/utils/formatters';

const professionOptions = PROFESSION_TYPES.map((p) => ({ value: p, label: p }));
const specializationOptions = SPECIALIZATIONS.map((s) => ({
  value: s,
  label: s,
}));

export default function FirmProfessionalsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.firmId || user.linkedId : undefined;
  const dashboard = useDashboard(ROLES.FIRM_ADMIN, linkedId);

  const firmProfessionals = dashboard.professionals || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [newPro, setNewPro] = useState({
    name: '',
    email: '',
    professionType: '',
    specialization: '',
  });

  function handleNewProChange(e) {
    const { name, value } = e.target;
    setNewPro((p) => ({ ...p, [name]: value }));
  }

  function handleAddPro(e) {
    e.preventDefault();
    setModalOpen(false);
    setNewPro({
      name: '',
      email: '',
      professionType: '',
      specialization: '',
    });
  }

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Professionals"
      subtitle={t('dashFirm.team.desc')}
    >
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t('dashFirm.team.title')}
            </h2>
            <p className="text-sm text-slate-500">{t('dashFirm.team.desc')}</p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            {t('dashFirm.team.add')}
          </Button>
        </div>

        {firmProfessionals.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title={t('dashFirm.team.emptyTitle')}
            description={t('dashFirm.team.emptyDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {firmProfessionals.map((pro) => (
              <Card key={pro.id} hover>
                <div className="flex items-start gap-3">
                  <Avatar
                    src={pro.profilePhoto || pro.avatar || pro.photo}
                    name={pro.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">
                      {pro.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {pro.professionType}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <RatingStars rating={pro.rating} size="sm" />
                      <Badge variant={pro.availableNow ? 'green' : 'gray'}>
                        {pro.availableNow
                          ? t('dashFirm.team.available')
                          : t('dashFirm.team.offline')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>
                    {t('dashFirm.team.experience', {
                      years: pro.experience,
                    })}
                  </span>
                  <span className="font-medium text-slate-700">
                    {formatRate(pro.perMinuteRate)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('dashFirm.modal.title')}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              {t('dash.common.cancel')}
            </Button>
            <Button size="sm" type="submit" form="add-pro-form">
              {t('dashFirm.modal.addToTeam')}
            </Button>
          </>
        }
      >
        <form id="add-pro-form" onSubmit={handleAddPro} className="space-y-4">
          <Input
            label={t('dashFirm.modal.fullName')}
            name="name"
            value={newPro.name}
            onChange={handleNewProChange}
            placeholder={t('dashFirm.modal.fullNamePlaceholder')}
          />
          <Input
            label={t('dashFirm.modal.email')}
            name="email"
            type="email"
            value={newPro.email}
            onChange={handleNewProChange}
            placeholder={t('dashFirm.modal.emailPlaceholder')}
          />
          <Select
            label={t('dashFirm.modal.professionType')}
            name="professionType"
            value={newPro.professionType}
            onChange={handleNewProChange}
            options={professionOptions}
            placeholder={t('dashFirm.modal.professionPlaceholder')}
          />
          <Select
            label={t('dashFirm.modal.specialization')}
            name="specialization"
            value={newPro.specialization}
            onChange={handleNewProChange}
            options={specializationOptions}
            placeholder={t('dashFirm.modal.specializationPlaceholder')}
          />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
