import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/colors.dart';
import '../controllers/driver_kyc_controller.dart';

class DriverKycView extends GetView<DriverKycController> {
  const DriverKycView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Complete Driver KYC',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
          child: Form(
            key: controller.formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfo(context),
                const SizedBox(height: 16),
                _buildFormCard(context),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfo(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.verified_user_outlined,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Just one last step',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Add your vehicle details and required documents to start receiving delivery requests.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Vehicle information',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: controller.plateNumberController,
            textInputAction: TextInputAction.next,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Plate number',
              hintText: 'Enter plate number',
              prefixIcon: Icon(
                Icons.confirmation_number_outlined,
                size: 22,
                color: AppColors.textSecondary,
              ),
              filled: true,
              fillColor: AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: AppColors.inputBorderFocused,
                  width: 2,
                ),
              ),
            ),
            validator: controller.validatePlateNumber,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: controller.addressController,
            textInputAction: TextInputAction.next,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Address',
              hintText: 'Enter your address',
              prefixIcon: Icon(
                Icons.location_on_outlined,
                size: 22,
                color: AppColors.textSecondary,
              ),
              filled: true,
              fillColor: AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: AppColors.inputBorderFocused,
                  width: 2,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Obx(
            () => DropdownButtonFormField<String>(
              value: controller.selectedVehicleType.value,
              items: controller.vehicleTypeItems,
              onChanged: controller.onVehicleTypeChanged,
              decoration: InputDecoration(
                labelText: 'Vehicle type',
                prefixIcon: Icon(
                  Icons.directions_car_filled_outlined,
                  size: 22,
                  color: AppColors.textSecondary,
                ),
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppColors.inputBorderFocused,
                    width: 2,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Documents',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'All documents are required: car license, fyda front & back, and one additional document.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 16),
          _buildDocumentTile(
            context: context,
            label: 'Car license',
            description: 'Upload a clear photo of your car/driver license.',
            icon: Icons.badge_outlined,
            pathRx: controller.driverLicensePath,
          ),
          const SizedBox(height: 12),
          _buildDocumentTile(
            context: context,
            label: 'Fyda front',
            description: 'Upload the front side of your fyda.',
            icon: Icons.credit_card_outlined,
            pathRx: controller.fydaFrontPath,
          ),
          const SizedBox(height: 12),
          _buildDocumentTile(
            context: context,
            label: 'Fyda back',
            description: 'Upload the back side of your fyda.',
            icon: Icons.credit_card_rounded,
            pathRx: controller.fydaBackPath,
          ),
          const SizedBox(height: 12),
          _buildDocumentTile(
            context: context,
            label: 'Additional document',
            description: 'Upload any additional supporting document.',
            icon: Icons.description_outlined,
            pathRx: controller.additionalDocumentPath,
          ),
          const SizedBox(height: 24),
          Obx(() => _buildSubmitButton(context)),
        ],
      ),
    );
  }

  Widget _buildDocumentTile({
    required BuildContext context,
    required String label,
    required String description,
    required IconData icon,
    required Rx<String?> pathRx,
  }) {
    return Obx(
      () {
        final hasFile = pathRx.value != null;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasFile ? AppColors.success : AppColors.inputBorder,
            ),
            color: AppColors.inputBackground,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style:
                          Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasFile ? 'File selected' : description,
                      style:
                          Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: hasFile
                                    ? AppColors.success
                                    : AppColors.textSecondary,
                              ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () => controller.pickImage(pathRx),
                child: Text(
                  hasFile ? 'Change' : 'Upload',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubmitButton(BuildContext context) {
    final loading = controller.isLoading.value;
    return SizedBox(
      height: 52,
      child: FilledButton(
        onPressed: loading ? null : controller.submit,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: loading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.textOnPrimary,
                ),
              )
            : const Text(
                'Submit',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}

