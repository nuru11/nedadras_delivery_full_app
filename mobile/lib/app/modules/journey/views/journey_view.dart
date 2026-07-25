import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/colors.dart';
import '../../../../core/services/delivery_service.dart';
import '../controllers/journey_controller.dart';

class JourneyView extends GetView<JourneyController> {
  const JourneyView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Obx(() {
          final delivery = controller.activeDelivery.value;
          final showBackToList = controller.isListMode && delivery != null;
          return AppBar(
            backgroundColor: AppColors.surface,
            elevation: 0,
            scrolledUnderElevation: 1,
            leading: showBackToList
                ? IconButton(
                    icon: Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
                    onPressed: () => controller.backToList(),
                  )
                : null,
            title: Text(
              delivery != null ? 'Journey detail' : 'Ongoing journeys',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
                onPressed: () => controller.refresh(),
                tooltip: 'Refresh',
              ),
            ],
          );
        }),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    color: AppColors.primary,
                    strokeWidth: 3,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Loading journey...',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          );
        }
        final delivery = controller.activeDelivery.value;
        if (delivery != null) {
          return _buildDetailBody(context, delivery);
        }
        if (controller.isListMode && controller.activeDeliveries.isNotEmpty) {
          return _buildListBody(context);
        }
        return _buildEmptyState(context);
      }),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  width: 1,
                ),
              ),
              child: Icon(
                Icons.local_shipping_outlined,
                size: 56,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'No active delivery',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'You don\'t have any ongoing journeys right now.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => Get.back(),
              icon: const Icon(Icons.home_rounded, size: 20),
              label: const Text('Back to home'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListBody(BuildContext context) {
    final list = controller.activeDeliveries;
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  controller.isDriver ? 'Your trips' : 'Your ongoing journeys',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${list.length} active ${list.length == 1 ? 'trip' : 'trips'}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final d = list[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _JourneyListCard(
                    delivery: d,
                    onTap: () => controller.selectDelivery(d),
                  ),
                );
              },
              childCount: list.length,
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 20)),
      ],
    );
  }

  Widget _buildDetailBody(BuildContext context, ActiveDelivery delivery) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StatusChip(status: delivery.status),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: AppColors.textPrimary.withValues(alpha: 0.06),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(
                  title: 'Pickup',
                  subtitle: delivery.pickupDisplay,
                  icon: Icons.trip_origin_rounded,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 22,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 2,
                              height: 10,
                              color: AppColors.primary.withValues(alpha: 0.4),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Icon(
                                Icons.arrow_downward_rounded,
                                size: 16,
                                color: AppColors.primary.withValues(alpha: 0.6),
                              ),
                            ),
                            Container(
                              width: 2,
                              height: 10,
                              color: AppColors.primary.withValues(alpha: 0.4),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Divider(height: 1, color: AppColors.divider),
                      ),
                    ],
                  ),
                ),
                _InfoRow(
                  title: 'Drop-off',
                  subtitle: delivery.dropDisplay,
                  icon: Icons.location_on_rounded,
                ),
                if (controller.isDriver &&
                    ((delivery.receiverName != null && delivery.receiverName!.trim().isNotEmpty) ||
                        (delivery.receiverPhone != null && delivery.receiverPhone!.trim().isNotEmpty))) ...[
                  const SizedBox(height: 16),
                  if (delivery.receiverName != null && delivery.receiverName!.trim().isNotEmpty)
                    _InfoRow(
                      title: 'Receiver name',
                      subtitle: delivery.receiverName!,
                      icon: Icons.person_outline_rounded,
                    ),
                  if (delivery.receiverName != null &&
                      delivery.receiverName!.trim().isNotEmpty &&
                      delivery.receiverPhone != null &&
                      delivery.receiverPhone!.trim().isNotEmpty)
                    const SizedBox(height: 12),
                  if (delivery.receiverPhone != null && delivery.receiverPhone!.trim().isNotEmpty)
                    _ReceiverPhoneRow(
                      phone: delivery.receiverPhone!,
                      onCall: () => controller.callReceiver(delivery.receiverPhone!),
                    ),
                ],
                if (controller.isDriver &&
                    delivery.objectType != null &&
                    delivery.objectType!.trim().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _InfoRow(
                    title: 'Object type',
                    subtitle: delivery.objectType!,
                    icon: Icons.inventory_2_outlined,
                  ),
                ],
                if (controller.isDriver &&
                    delivery.description != null &&
                    delivery.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _InfoRow(
                    title: 'Note',
                    subtitle: delivery.description!,
                    icon: Icons.notes_outlined,
                  ),
                ],
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.straighten_rounded,
                          size: 22,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${delivery.distanceKm.toStringAsFixed(1)} km • ${delivery.price.toStringAsFixed(0)} ETB',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (!controller.isDriver &&
              ((delivery.driverName != null && delivery.driverName!.trim().isNotEmpty) ||
                  (delivery.driverPhone != null && delivery.driverPhone!.trim().isNotEmpty)))
            _buildDriverInfoSection(context, delivery),
          if (!controller.isDriver) _buildDriverLocationSection(context),
          const SizedBox(height: 24),
          _buildActionButtons(context, delivery),
          if (controller.canDriverMarkPaid) _buildMarkPaidButton(context),
          if (delivery.status == 'delivered' && !controller.canDriverMarkPaid)
            _buildCompletedSection(context, delivery),
          if (!controller.canDriverMarkPicked &&
              !controller.canDriverMarkDelivered &&
              delivery.status != 'delivered')
            _buildWaitingMessage(context, delivery),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDriverInfoSection(BuildContext context, ActiveDelivery delivery) {
    return Container(
      margin: const EdgeInsets.only(top: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person_rounded, color: AppColors.primary, size: 22),
              const SizedBox(width: 8),
              Text(
                'Your driver',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (delivery.driverName != null && delivery.driverName!.trim().isNotEmpty)
            _InfoRow(
              title: 'Driver name',
              subtitle: delivery.driverName!,
              icon: Icons.badge_outlined,
            ),
          if (delivery.driverName != null &&
              delivery.driverName!.trim().isNotEmpty &&
              delivery.driverPhone != null &&
              delivery.driverPhone!.trim().isNotEmpty)
            const SizedBox(height: 12),
          if (delivery.driverPhone != null && delivery.driverPhone!.trim().isNotEmpty)
            _DriverPhoneRow(
              phone: delivery.driverPhone!,
              onCall: () => controller.callDriver(delivery.driverPhone!),
            ),
        ],
      ),
    );
  }

  Widget _buildDriverLocationSection(BuildContext context) {
    return Obx(() {
      final loc = controller.driverLocation.value;
        return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on_rounded, color: AppColors.primary, size: 22),
                const SizedBox(width: 8),
                Text(
                  'Driver location',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (loc == null)
              Text(
                'Loading driver location...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              )
            else ...[
              Text(
                '${loc.lat.toStringAsFixed(5)}, ${loc.lng.toStringAsFixed(5)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontFamily: 'monospace',
                    ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => controller.openDriverInMaps(),
                  icon: const Icon(Icons.map_rounded, size: 20),
                  label: const Text('Open in Google Maps'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    });
  }

  Widget _buildActionButtons(BuildContext context, ActiveDelivery delivery) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (controller.canDriverMarkPicked)
          _ActionButton(
            onPressed: controller.isUpdatingStatus ? null : () => controller.markPicked(),
            isLoading: controller.isUpdatingStatus,
            icon: Icons.play_arrow_rounded,
            label: 'Start journey (Mark as picked)',
            style: _ActionButtonStyle.primary,
          ),
        if (controller.canDriverMarkDelivered) ...[
          if (controller.canDriverMarkPicked) const SizedBox(height: 12),
          _ActionButton(
            onPressed: controller.isUpdatingStatus ? null : () => controller.markDelivered(),
            isLoading: controller.isUpdatingStatus,
            icon: Icons.check_circle_rounded,
            label: 'Complete delivery (Mark as delivered)',
            style: _ActionButtonStyle.success,
          ),
        ],
        if (controller.canDriverCancel || controller.canUserCancel) ...[
          const SizedBox(height: 12),
          _ActionButton(
            onPressed: controller.isUpdatingStatus ? null : () => controller.cancelTrip(),
            isLoading: controller.isUpdatingStatus,
            icon: Icons.cancel_outlined,
            label: 'Cancel trip',
            style: _ActionButtonStyle.danger,
          ),
        ],
      ],
    );
  }

  Widget _buildMarkPaidButton(BuildContext context) {
    return Obx(() {
      final updating = controller.isUpdatingPayment;
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: SizedBox(
          height: 52,
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: updating ? null : () => controller.markPaid(),
            icon: updating
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.textOnPrimary,
                    ),
                  )
                : const Icon(Icons.payments_rounded, size: 22),
            label: Text(updating ? 'Recording…' : 'Mark as paid (cash received)'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.textOnPrimary,
              disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.6),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
        ),
      );
    });
  }

  Widget _buildCompletedSection(BuildContext context, ActiveDelivery delivery) {
    final showCommission = controller.isDriver &&
        (delivery.driverCommissionAmount != null || delivery.amountDueToAdmin != null);
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_rounded, color: AppColors.success, size: 28),
              const SizedBox(width: 10),
              Text(
                'Delivery completed!',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          if (showCommission) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  if (delivery.driverCommissionAmount != null)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Your commission',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                        Text(
                          '${delivery.driverCommissionAmount!.toStringAsFixed(0)} ETB',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                        ),
                      ],
                    ),
                  if (delivery.driverCommissionAmount != null &&
                      delivery.amountDueToAdmin != null)
                    const SizedBox(height: 8),
                  if (delivery.amountDueToAdmin != null)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Amount to hand over to admin',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                        Text(
                          '${delivery.amountDueToAdmin!.toStringAsFixed(0)} ETB',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => Get.back(),
              icon: const Icon(Icons.home_rounded, size: 20),
              label: const Text('Back to home'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWaitingMessage(BuildContext context, ActiveDelivery delivery) {
    final message = controller.isDriver
        ? 'Journey in progress.'
        : delivery.status == 'accepted'
            ? 'Waiting for driver to start the trip.'
            : delivery.status == 'picked' || delivery.status == 'on_way'
                ? 'Driver is on the way. They will mark as delivered when done.'
                : 'Journey in progress.';
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, size: 20, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _JourneyListCard extends StatelessWidget {
  const _JourneyListCard({
    required this.delivery,
    required this.onTap,
  });

  final ActiveDelivery delivery;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.textPrimary.withValues(alpha: 0.05),
                blurRadius: 16,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.local_shipping_rounded,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${delivery.pickupDisplay} → ${delivery.dropDisplay}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    _StatusChip(status: delivery.status),
                    const SizedBox(height: 4),
                    Text(
                      '${delivery.distanceKm.toStringAsFixed(1)} km • ${delivery.price.toStringAsFixed(0)} ETB',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReceiverPhoneRow extends StatelessWidget {
  const _ReceiverPhoneRow({
    required this.phone,
    required this.onCall,
  });

  final String phone;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.phone_outlined, color: AppColors.primary, size: 22),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Receiver phone',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                phone,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onCall,
                  icon: const Icon(Icons.phone_rounded, size: 18),
                  label: const Text('Call receiver'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DriverPhoneRow extends StatelessWidget {
  const _DriverPhoneRow({
    required this.phone,
    required this.onCall,
  });

  final String phone;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.phone_outlined, color: AppColors.primary, size: 22),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Driver phone',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                phone,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onCall,
                  icon: const Icon(Icons.phone_rounded, size: 18),
                  label: const Text('Call driver'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.primary, size: 22),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

enum _ActionButtonStyle { primary, success, danger }

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.onPressed,
    required this.isLoading,
    required this.icon,
    required this.label,
    required this.style,
  });

  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData icon;
  final String label;
  final _ActionButtonStyle style;

  @override
  Widget build(BuildContext context) {
    final (backgroundColor, foregroundColor) = switch (style) {
      _ActionButtonStyle.primary => (AppColors.primary, AppColors.textOnPrimary),
      _ActionButtonStyle.success => (AppColors.success, AppColors.textOnPrimary),
      _ActionButtonStyle.danger => (AppColors.error, AppColors.textOnPrimary),
    };

    return SizedBox(
      height: 52,
      width: double.infinity,
      child: style == _ActionButtonStyle.danger
          ? OutlinedButton.icon(
              onPressed: onPressed,
              icon: isLoading
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.error,
                      ),
                    )
                  : Icon(icon, size: 22),
              label: Text(isLoading ? 'Cancelling...' : label),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            )
          : FilledButton.icon(
              onPressed: onPressed,
              icon: isLoading
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: foregroundColor,
                      ),
                    )
                  : Icon(icon, size: 22),
              label: Text(isLoading ? 'Updating...' : label),
              style: FilledButton.styleFrom(
                backgroundColor: backgroundColor,
                foregroundColor: foregroundColor,
                disabledBackgroundColor: backgroundColor.withValues(alpha: 0.6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
            ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.4),
                  blurRadius: 4,
                  spreadRadius: 0,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status.toUpperCase(),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
          ),
        ],
      ),
    );
  }
}

Color _statusColor(String status) {
  switch (status) {
    case 'accepted':
      return AppColors.info;
    case 'picked':
    case 'on_way':
      return AppColors.warning;
    case 'delivered':
      return AppColors.success;
    case 'cancelled':
      return AppColors.error;
    default:
      return AppColors.textSecondary;
  }
}
