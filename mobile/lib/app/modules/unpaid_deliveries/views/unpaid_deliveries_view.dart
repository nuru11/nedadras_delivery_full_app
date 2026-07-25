import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../controllers/unpaid_deliveries_controller.dart';

class UnpaidDeliveriesView extends GetView<UnpaidDeliveriesController> {
  const UnpaidDeliveriesView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Unpaid trips'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => controller.fetchUnpaidTrips(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.error.value.isNotEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline,
                      size: 48, color: Colors.red.shade400),
                  const SizedBox(height: 16),
                  Text(
                    controller.error.value,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () => controller.fetchUnpaidTrips(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        final list = controller.unpaidTrips;
        if (list.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.payments_outlined,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'No unpaid trips',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey.shade700,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Completed trips that are not yet marked as paid will appear here.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => controller.fetchUnpaidTrips(),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: list.length,
            itemBuilder: (context, index) {
              final item = list[index];
              final isUpdating = controller.updatingId == item.id;
              return _UnpaidTripCard(
                item: item,
                isUpdating: isUpdating,
                isDriver: controller.isDriver,
                onMarkPaid: () => controller.markTripPaid(item),
                onPayWithWallet: () => controller.payWithWallet(item),
              );
            },
          ),
        );
      }),
    );
  }
}

class _UnpaidTripCard extends StatelessWidget {
  const _UnpaidTripCard({
    required this.item,
    required this.isUpdating,
    required this.isDriver,
    required this.onMarkPaid,
    required this.onPayWithWallet,
  });

  final DeliveryHistoryItem item;
  final bool isUpdating;
  final bool isDriver;
  final VoidCallback onMarkPaid;
  final VoidCallback onPayWithWallet;

  String _formatDate(String iso) {
    if (iso.isEmpty) return '';
    try {
      final dt = DateTime.tryParse(iso);
      if (dt == null) return iso;
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.check_circle,
                  color: Colors.green,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Delivered • Unpaid',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const Spacer(),
                if (item.createdAt.isNotEmpty)
                  Text(
                    _formatDate(item.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              item.pickupDisplay,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.arrow_downward,
                    size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    item.dropDisplay,
                    style: Theme.of(context).textTheme.bodyMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '${item.distanceKm.toStringAsFixed(1)} km',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade700,
                      ),
                ),
                const SizedBox(width: 16),
                Text(
                  '${item.price.toStringAsFixed(0)} ETB',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: FilledButton.icon(
                onPressed: isUpdating
                    ? null
                    : (isDriver ? onMarkPaid : onPayWithWallet),
                icon: isUpdating
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.payments_rounded, size: 20),
                label: Text(
                  isUpdating
                      ? (isDriver ? 'Recording…' : 'Paying…')
                      : (isDriver
                          ? 'Mark as paid (cash received)'
                          : 'Pay with wallet'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

