import 'package:delivery_app/app/modules/journey/views/journey_view.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/colors.dart';
import '../../home/views/home_view.dart';
import '../../profile/views/profile_view.dart';
import '../controllers/main_controller.dart';

class MainView extends GetView<MainController> {
  const MainView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Obx(() => IndexedStack(
            index: controller.currentIndex.value,
            children: const [
              HomeView(),
              JourneyView(),
              ProfileView(),
            ],
          )),
      bottomNavigationBar: Obx(() => Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(
                top: BorderSide(color: AppColors.border, width: 1),
              ),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(
                colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppColors.primary,
                  onSurface: AppColors.textSecondary,
                  onSurfaceVariant: AppColors.textTertiary,
                ),
              ),
              child: NavigationBar(
                selectedIndex: controller.currentIndex.value,
                onDestinationSelected: controller.setIndex,
                backgroundColor: Colors.transparent,
                indicatorColor: AppColors.primary.withValues(alpha: 0.12),
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                height: 72,
                labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.home_outlined, size: 26),
                    selectedIcon: Icon(Icons.home_rounded, size: 26),
                    label: 'Home',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.route_outlined, size: 26),
                    selectedIcon: Icon(Icons.route_rounded, size: 26),
                    label: 'Journey',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.person_outline_rounded, size: 26),
                    selectedIcon: Icon(Icons.person_rounded, size: 26),
                    label: 'Profile',
                  ),
                ],
              ),
            ),
          )),
    );
  }
}
