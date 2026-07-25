import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/colors.dart';
import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/places_service.dart';
import '../../../../core/widgets/places_autocomplete_field.dart';
import '../controllers/home_controller.dart';
import '../models/delivery_request_item.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  static InputDecoration _inputDecoration({
    required String hintText,
    IconData? prefixIcon,
    bool error = false,
  }) {
    final borderColor = error ? AppColors.error : AppColors.inputBorder;
    final focusedColor = error ? AppColors.error : AppColors.inputBorderFocused;
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon != null
          ? Icon(prefixIcon, size: 22, color: AppColors.textSecondary)
          : null,
      filled: true,
      fillColor: AppColors.inputBackground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: focusedColor, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayName = controller.displayName;
    final isUserHome = !controller.isDriver;

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: false,
      appBar: AppBar(
        backgroundColor: isUserHome ? AppColors.primary : AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: Text(
          controller.isDriver ? 'Driver' : 'Home',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: isUserHome ? Colors.white : AppColors.textPrimary,
              ),
        ),
        iconTheme: IconThemeData(
          color: isUserHome ? Colors.white : AppColors.textPrimary,
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.logout_rounded,
              color: isUserHome ? Colors.white : AppColors.textSecondary,
            ),
            onPressed: () => controller.logout(),
            tooltip: 'Log out',
          ),
        ],
      ),
      body: controller.isDriver
          ? _buildDriverBody(context, displayName)
          : _buildUserBody(context, displayName),
    );
  }

  Widget _buildDriverBody(BuildContext context, String displayName) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildWelcomeCard(context, displayName),
          const SizedBox(height: 16),
          Obx(() {
            final list = controller.activeDeliveries;
            if (list.isEmpty) return const SizedBox.shrink();
            final active = list.first;
            final isMultiple = list.length > 1;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _OngoingCard(
                title: isMultiple
                    ? 'Ongoing trips'
                    : (active.status == 'delivered' ? 'Journey completed' : 'Ongoing journey'),
                subtitle: isMultiple
                    ? 'You have ${list.length} trips. Tap to view.'
                    : '${active.pickupDisplay} → ${active.dropDisplay}',
                status: active.status,
                onTap: () => controller.navigateToJourney(),
              ),
            );
          }),
          Obx(() => _ConnectionChip(
                connected: controller.isSocketConnected,
                label: controller.isSocketConnected
                    ? 'Online — sending location every 5s'
                    : 'Connecting...',
              )),
          const SizedBox(height: 20),
          _SectionHeader(
            title: 'Delivery requests',
            trailing: IconButton(
              icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
              onPressed: () => controller.fetchPendingRequests(),
              tooltip: 'Refresh',
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Obx(() {
              final list = controller.deliveryRequests;
              final hasOngoingTrip = controller.isDriver
                  ? controller.activeDeliveries.length >= maxDriverTrips
                  : controller.activeDelivery.value != null;
              if (list.isEmpty) {
                return _EmptyState(
                  message:
                      'No requests yet. You\'ll see new delivery requests here.',
                  onRefresh: () => controller.fetchPendingRequests(),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.only(bottom: 16),
                itemCount: list.length,
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _DeliveryRequestCard(
                    item: list[index],
                    onAccept: () =>
                        controller.acceptRequest(list[index].deliveryRequestId),
                    onReject: () =>
                        controller.rejectRequest(list[index].deliveryRequestId),
                    isLoading:
                        controller.loadingRequestId == list[index].deliveryRequestId,
                    hasOngoingTrip: hasOngoingTrip,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard(BuildContext context, String displayName) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              controller.isDriver ? Icons.delivery_dining : Icons.local_shipping_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back,',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  displayName,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserBody(BuildContext context, String displayName) {
    return ListView(
  physics: const BouncingScrollPhysics(),
  padding: EdgeInsets.only(
    bottom: 24 + MediaQuery.of(context).padding.bottom + 72,
  ),
  children: [
    _UserHomeHero(context: context, displayName: displayName),
    Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: _buildRequestFormCard(context),
    ),
  ],
);

  }

  /// Hero section for user home: gradient header with greeting and tagline.
  static Widget _UserHomeHero({required BuildContext context, required String displayName}) {
    return Container(
      width: double.infinity,
      height: 160,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primaryDark,
            AppColors.primary.withValues(alpha: 0.92),
          ],
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Hi, $displayName',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  'Where do you want to send something?',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.local_shipping_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
        ],
      ),
    );
  }

  /// Compact greeting for user (delivery-app style).
  static Widget _UserGreeting({required String displayName}) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hi, $displayName',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 2),
              // Text(
              //   'Where do you want to send something?',
              //   style: TextStyle(
              //     fontSize: 14,
              //     color: AppColors.textSecondary,
              //   ),
              // ),
            ],
          ),
        ),
      ],
    );
  }

  /// Hero bar suggesting new delivery (like Uber “Where to?”).
  static Widget _NewDeliveryHero({VoidCallback? onTap}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
        Text("jjj")
        ],
      ),
    );
  }

  Widget _buildRequestFormCard(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 400),
    
      width: double.infinity,
      // height: 200,
      
      decoration: BoxDecoration(
  color: Colors.white,
  borderRadius: const BorderRadius.vertical(
    top: Radius.circular(28),
    bottom: Radius.circular(24),
  ),
  border: Border.all(
    color: AppColors.border.withValues(alpha: 0.8),
  ),
  boxShadow: [
    BoxShadow(
      color: AppColors.textPrimary.withValues(alpha: 0.06),
      blurRadius: 24,
      offset: const Offset(0, 6),
    ),
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.04),
      blurRadius: 12,
      offset: const Offset(0, 2),
    ),
  ],
),

      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
          // Delivery type: pill segmented control
          Text(
            'Delivery type',
            style: _sectionLabelStyle(context),
          ),
          const SizedBox(height: 10),
          Obx(() {
            final isOutside = controller.isOutsideTown.value;
            return Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _DeliveryTypeChip(
                      icon: Icons.location_city_rounded,
                      label: 'In town',
                      isSelected: !isOutside,
                      onTap: () => controller.isOutsideTown.value = false,
                    ),
                  ),
                  Expanded(
                    child: _DeliveryTypeChip(
                      icon: Icons.map_rounded,
                      label: 'Outside town',
                      isSelected: isOutside,
                      onTap: () => controller.isOutsideTown.value = true,
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 24),
          // Route section
          _FormSection(
            title: 'Route',
            icon: Icons.route_rounded,
            child: Obx(() {
              final isOutside = controller.isOutsideTown.value;
              if (!isOutside) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('From', style: _sectionLabelStyle(context)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    PlacesAutocompleteField(
                      placesService: Get.find<PlacesService>(),
                      controller: controller.pickupSearchController,
                      hintText: 'Search pickup address in Addis Ababa...',
                      onPlaceSelected: controller.setPickup,
                      decoration: _inputDecoration(
                        hintText: 'Search pickup address...',
                        prefixIcon: Icons.trip_origin,
                      ),
                    ),
                    Obx(() {
                      final p = controller.pickup.value;
                      if (p == null) return const SizedBox.shrink();
                      final display = (p.name != null && p.name!.trim().isNotEmpty)
                          ? p.name!
                          : p.formattedAddress;
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          display,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.primary,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    Center(
                      child: IconButton(
                        onPressed: controller.swapPickupDropoff,
                        icon: Icon(
                          Icons.swap_vert_rounded,
                          color: AppColors.primary,
                          size: 28,
                        ),
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                        ),
                        tooltip: 'Swap pickup and dropoff',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: AppColors.secondary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('To', style: _sectionLabelStyle(context)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    PlacesAutocompleteField(
                      placesService: Get.find<PlacesService>(),
                      controller: controller.dropoffSearchController,
                      hintText: 'Search dropoff address in Addis Ababa...',
                      onPlaceSelected: controller.setDropoff,
                      decoration: _inputDecoration(
                        hintText: 'Search dropoff address...',
                        prefixIcon: Icons.location_on_outlined,
                      ),
                    ),
                    Obx(() {
                      final d = controller.dropoff.value;
                      if (d == null) return const SizedBox.shrink();
                      final display = (d.name != null && d.name!.trim().isNotEmpty)
                          ? d.name!
                          : d.formattedAddress;
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          display,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.secondary,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }),
                  ],
                );
              } else {
              // Outside-town: manual addresses.
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('From (outside town)', style: _sectionLabelStyle(context)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: controller.outsidePickupController,
                    decoration: _inputDecoration(
                      hintText: 'Enter pickup address...',
                      prefixIcon: Icons.trip_origin,
                    ),
                    onChanged: controller.setOutsidePickup,
                    maxLines: 1,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: AppColors.secondary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('To (outside town)', style: _sectionLabelStyle(context)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: controller.outsideDropoffController,
                    decoration: _inputDecoration(
                      hintText: 'Enter dropoff address...',
                      prefixIcon: Icons.location_on_outlined,
                    ),
                    onChanged: controller.setOutsideDropoff,
                    maxLines: 1,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 20),
                  Text('Weight (kg)', style: _sectionLabelStyle(context)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: controller.outsideWeightController,
                    decoration: _inputDecoration(
                      hintText: 'Enter weight (max 20 kg)',
                      prefixIcon: Icons.scale_outlined,
                    ),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    onChanged: controller.setOutsideWeight,
                  ),
                  const SizedBox(height: 6),
                  Obx(() {
                    final w = controller.outsideWeightKg;
                    final price = controller.outsidePrice;
                    String message;
                    Color color = AppColors.textSecondary;
                    if (w == null) {
                      message = 'Enter a valid weight up to 20 kg.';
                    } else if (w > 20) {
                      message = 'Weight must not be more than 20 kg.';
                      color = AppColors.error;
                    } else {
                      message =
                          'Total price: ${(price ?? 0).toStringAsFixed(0)} ETB';
                      color = AppColors.primary;
                    }
                    return Text(
                      message,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: color,
                          ),
                    );
                  }),
                ],
              );
            }
            }),
          ),
          const SizedBox(height: 24),
          // Details section
          _FormSection(
            title: 'Delivery details',
            icon: Icons.receipt_long_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
          Row(
            children: [
              Text('Receiver name', style: _sectionLabelStyle(context)),
              Text(' *', style: _sectionLabelStyle(context)?.copyWith(color: AppColors.error)),
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller.receiverNameController,
            decoration: _inputDecoration(
              hintText: 'Receiver name',
              prefixIcon: Icons.person_outline,
            ),
            onChanged: controller.setReceiverName,
            keyboardType: TextInputType.name,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Text('Receiver phone', style: _sectionLabelStyle(context)),
              Text(' *', style: _sectionLabelStyle(context)?.copyWith(color: AppColors.error)),
            ],
          ),
          const SizedBox(height: 8),
          Obx(() {
            final phone = controller.receiverPhone.value.trim();
            final invalid = phone.isNotEmpty && !controller.isReceiverPhoneValid;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: controller.receiverPhoneController,
                  decoration: _inputDecoration(
                    hintText: '09/+2519',
                    prefixIcon: Icons.phone_outlined,
                    error: invalid,
                  ),
                  onChanged: controller.setReceiverPhone,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                ),
                if (invalid)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      'Only (09...) or (+2519...) Allowed',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.error,
                          ),
                    ),
                  ),
              ],
            );
          }),
          const SizedBox(height: 20),
          Row(
            children: [
              Text('Object type', style: _sectionLabelStyle(context)),
              Text(' *', style: _sectionLabelStyle(context)?.copyWith(color: AppColors.error)),
            ],
          ),
          const SizedBox(height: 8),
          Obx(() => DropdownButtonFormField<String>(
                value: controller.objectType.value.isEmpty
                    ? null
                    : controller.objectType.value,
                decoration: _inputDecoration(
                  hintText: 'Select object type',
                  prefixIcon: Icons.inventory_2_outlined,
                ),
                hint: const Text('Select object type'),
                items: objectTypeOptions
                    .map((e) => DropdownMenuItem(
                          value: e,
                          child: Text(e[0].toUpperCase() + e.substring(1)),
                        ))
                    .toList(),
                onChanged: (value) => controller.setObjectType(value ?? ''),
              )),
              Obx(() {
                if (controller.objectType.value != 'other') return const SizedBox.shrink();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Text('Specify other (required)', style: _sectionLabelStyle(context)),
                        Text(' *', style: _sectionLabelStyle(context)?.copyWith(color: AppColors.error)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: controller.objectTypeOtherController,
                      decoration: _inputDecoration(
                        hintText: 'Describe the object type',
                        prefixIcon: Icons.edit_note,
                      ),
                      onChanged: controller.setObjectTypeOther,
                      textInputAction: TextInputAction.next,
                    ),
                  ],
                );
              }),
              const SizedBox(height: 20),
              Text('Description (optional)', style: _sectionLabelStyle(context)),
              const SizedBox(height: 8),
              TextFormField(
                controller: controller.descriptionController,
                decoration: _inputDecoration(
                  hintText: 'Add any notes about the delivery',
                  prefixIcon: Icons.notes_outlined,
                ),
                maxLines: 3,
                textInputAction: TextInputAction.newline,
              ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Text('Car type', style: _sectionLabelStyle(context)),
          // const SizedBox(height: 8),
          // Obx(() => DropdownButtonFormField<String>(
          //       value: controller.carType.value.isEmpty
          //           ? null
          //           : controller.carType.value,
          //       decoration: _inputDecoration(
          //         hintText: 'Select vehicle type',
          //         prefixIcon: Icons.directions_car_outlined,
          //       ),
          //       hint: const Text('Select vehicle type'),
          //       items: carTypeOptions
          //           .map((e) => DropdownMenuItem(
          //                 value: e,
          //                 child: Text(e[0].toUpperCase() + e.substring(1)),
          //               ))
          //           .toList(),
          //       onChanged: controller.setCarType,
          //     )),
          const SizedBox(height: 24),
          // In-town estimate + plans (outside-town does not use estimate).
          Obx(() {
            if (controller.isOutsideTown.value) {
              return const SizedBox.shrink();
            }
            final hasLocations =
                controller.pickup.value != null && controller.dropoff.value != null;
            final loading = controller.isLoadingEstimate.value;
            return SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed:
                    hasLocations && !loading ? () => controller.fetchEstimate() : null,
                icon: loading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      )
                    : Icon(Icons.route_rounded, size: 20, color: AppColors.primary),
                label: Text(loading ? 'Getting estimate...' : 'Get estimate'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          Obx(() {
            if (controller.isOutsideTown.value) {
              return const SizedBox.shrink();
            }
            final est = controller.estimateResult.value;
            if (est == null) return const SizedBox.shrink();
            final selectedPlan = controller.selectedPlan.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${est.distanceKm.toStringAsFixed(1)} km',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 12),
                _PlanCard(
                  title: 'Express',
                  eta: est.plans['express']!.eta,
                  price: est.plans['express']!.price,
                  isSelected: selectedPlan == 'express',
                  onTap: () => controller.setSelectedPlan(
                    selectedPlan == 'express' ? null : 'express',
                  ),
                ),
                const SizedBox(height: 8),
                _PlanCard(
                  title: 'Standard',
                  eta: est.plans['standard']!.eta,
                  price: est.plans['standard']!.price,
                  isSelected: selectedPlan == 'standard',
                  onTap: () => controller.setSelectedPlan(
                    selectedPlan == 'standard' ? null : 'standard',
                  ),
                ),
                const SizedBox(height: 8),
                _PlanCard(
                  title: 'Same Day',
                  eta: est.plans['same_day']!.eta,
                  price: est.plans['same_day']!.price,
                  isSelected: selectedPlan == 'same_day',
                  onTap: () => controller.setSelectedPlan(
                    selectedPlan == 'same_day' ? null : 'same_day',
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 28),
          Obx(() {
            final submitting = controller.isSubmitting.value;
            final isOutside = controller.isOutsideTown.value;
            final canSubmitInTown = controller.canSubmitInTown;
            final canSubmitOutside = controller.canSubmitOutsideTown;
            final enabled = !submitting &&
                (!isOutside ? canSubmitInTown : canSubmitOutside);
            return SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton.icon(
                onPressed: enabled
                    ? () => isOutside
                        ? controller.submitOutsideTownRequest()
                        : controller.submitRequest()
                    : null,
                icon: submitting
                    ? SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textOnCtaAccent,
                        ),
                      )
                    : const SizedBox.shrink(),
                label: Text(
                  submitting ? 'Requesting…' : 'Request delivery',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.ctaAccent,
                  foregroundColor: AppColors.textOnCtaAccent,
                  disabledBackgroundColor: AppColors.ctaAccentLight.withValues(alpha: 0.6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
              ),
            );
          }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  TextStyle? _sectionLabelStyle(BuildContext context) {
    return Theme.of(context).textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        );
  }
}

/// Section wrapper for the book-delivery form (Route, Delivery details).
class _FormSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _FormSection({
    required this.title,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: AppColors.primary,
                width: 4,
              ),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              child,
            ],
          ),
        ),
      ),
    );
  }
}


/// In town / Outside town toggle chip.
class _DeliveryTypeChip extends StatelessWidget {
  const _DeliveryTypeChip({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 0,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? AppColors.textOnPrimary : AppColors.textSecondary,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppColors.textOnPrimary : AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.eta,
    required this.price,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final String eta;
  final double price;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textColor = isSelected ? AppColors.textOnPrimary : AppColors.textPrimary;
    final secondaryTextColor = isSelected ? AppColors.textOnPrimary.withValues(alpha: 0.9) : AppColors.textSecondary;
    final priceColor = isSelected ? AppColors.textOnPrimary : AppColors.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.2),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: isSelected ? AppColors.textOnPrimary : AppColors.textTertiary,
                size: 22,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: textColor,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      eta,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: secondaryTextColor,
                          ),
                    ),
                  ],
                ),
              ),
              Text(
                '${price.toStringAsFixed(0)} ETB',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: priceColor,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

/// User-facing ongoing delivery card (tracking style).
class _UserOngoingCard extends StatelessWidget {
  const _UserOngoingCard({
    required this.active,
    required this.onTap,
  });

  final ActiveDelivery active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDelivered = active.status == 'delivered';
    final statusLabel = isDelivered ? 'Completed' : _statusLabel(active.status);
    final statusColor = isDelivered ? AppColors.success : AppColors.info;

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(20),
      elevation: 0,
      shadowColor: AppColors.textPrimary.withValues(alpha: 0.06),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isDelivered ? Icons.check_circle_rounded : Icons.local_shipping_rounded,
                      color: statusColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          statusLabel,
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                color: statusColor,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${active.pickupDisplay} → ${active.dropDisplay}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w500,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary, size: 24),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.straighten_rounded, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    '${active.distanceKm.toStringAsFixed(1)} km',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    '${active.price.toStringAsFixed(0)} ETB',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: FilledButton(
                  onPressed: onTap,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.textOnPrimary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(isDelivered ? 'View details' : 'Track delivery'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _statusLabel(String status) {
    switch (status) {
      case 'accepted':
        return 'Driver assigned';
      case 'picked':
        return 'Picked up';
      case 'on_way':
        return 'On the way';
      case 'delivered':
        return 'Delivered';
      default:
        return status.toUpperCase();
    }
  }
}

class _OngoingCard extends StatelessWidget {
  const _OngoingCard({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String status;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      shadowColor: AppColors.textPrimary.withValues(alpha: 0.08),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
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
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      status.toUpperCase(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
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

class _ConnectionChip extends StatelessWidget {
  const _ConnectionChip({required this.connected, required this.label});

  final bool connected;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: connected ? AppColors.success.withValues(alpha: 0.1) : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            connected ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
            color: connected ? AppColors.success : AppColors.textTertiary,
            size: 18,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: connected ? AppColors.success : AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message, required this.onRefresh});

  final String message;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 56, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: const Text('Refresh'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
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
}

class _DriverAcceptedCard extends StatelessWidget {
  const _DriverAcceptedCard({
    required this.status,
    required this.delivery,
    required this.driverLocation,
    required this.onViewJourney,
  });

  final String status;
  final Map<String, dynamic> delivery;
  final DriverLocation? driverLocation;
  final VoidCallback onViewJourney;

  @override
  Widget build(BuildContext context) {
    final pickup = (delivery['pickup_name'] ?? delivery['pickup_address'])?.toString() ?? '';
    final drop = (delivery['drop_name'] ?? delivery['drop_address'])?.toString() ?? '';
    final distance = delivery['distance_km'];
    final price = delivery['price'];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: AppColors.success.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.directions_car_rounded, color: AppColors.success, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Driver on the way',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (pickup.isNotEmpty || drop.isNotEmpty) ...[
            Text(
              pickup,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 20,
                    child: Column(
                      children: [
                        Icon(Icons.circle, size: 6, color: AppColors.primary),
                        Container(width: 2, height: 8, color: AppColors.primary.withValues(alpha: 0.4)),
                        Icon(Icons.location_on_rounded, size: 18, color: AppColors.primary),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      drop,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          if (distance != null && price != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(Icons.straighten_rounded, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    '$distance km • $price ETB',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          if (driverLocation != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () async {
                  final loc = driverLocation!;
                  final uri = Uri.parse('https://www.google.com/maps?q=${loc.lat},${loc.lng}');
                  try {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Icon(Icons.map_rounded, size: 20, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Open driver location in Maps',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                'Getting driver location…',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
              ),
            ),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton.icon(
              onPressed: onViewJourney,
              icon: const Icon(Icons.track_changes_rounded, size: 22),
              label: const Text('Track delivery'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DeliveryRequestCard extends StatelessWidget {
  const _DeliveryRequestCard({
    required this.item,
    required this.onAccept,
    required this.onReject,
    this.isLoading = false,
    this.hasOngoingTrip = false,
  });

  final DeliveryRequestItem item;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final bool isLoading;
  final bool hasOngoingTrip;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
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
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.local_shipping_outlined,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${item.pickupDisplay} → ${item.dropDisplay}',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${item.distanceKm.toStringAsFixed(1)} km • ${item.price.toStringAsFixed(0)} ETB',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          if (item.objectType.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Type: ${item.objectType}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ),
          if (hasOngoingTrip)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 4),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 16, color: AppColors.warning),
                  const SizedBox(width: 6),
                  Text(
                    'Finish your current trip first',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.warning,
                        ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: FilledButton.icon(
                    onPressed: (isLoading || hasOngoingTrip) ? null : onAccept,
                    icon: isLoading
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.textOnPrimary,
                            ),
                          )
                        : const Icon(Icons.check_rounded, size: 20),
                    label: const Text('Accept'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.textOnPrimary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: OutlinedButton.icon(
                    onPressed: isLoading ? null : onReject,
                    icon: const Icon(Icons.close_rounded, size: 20),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
