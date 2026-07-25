import 'package:get/get.dart';

import '../../auth/auth_repository.dart';

/// Controls the main shell with bottom navigation.
class MainController extends GetxController {
  MainController({required AuthRepository repository}) : _repository = repository;

  final AuthRepository _repository;

  final RxInt currentIndex = 0.obs;

  bool get isDriver => (_repository.role ?? '').toLowerCase() == 'driver';

  void setIndex(int index) => currentIndex.value = index;
}
