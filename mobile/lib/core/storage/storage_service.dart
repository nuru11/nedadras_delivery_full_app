import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class StorageKeys {
  StorageKeys._();

  static const token = 'jwt_token';
  static const phone = 'phone_number';
  static const name = 'user_name';
  static const role = 'user_role';
  static const kyc = 'user_kyc';
  static const status = 'user_status';
}

class StorageService extends GetxService {
  late final GetStorage _box;

  Future<StorageService> init() async {
    await GetStorage.init();
    _box = GetStorage();
    return this;
  }

  String? readToken() => _box.read<String>(StorageKeys.token);

  Future<void> writeToken(String? token) async {
    if (token == null) {
      await _box.remove(StorageKeys.token);
      return;
    }
    await _box.write(StorageKeys.token, token);
  }

  String? readPhone() => _box.read<String>(StorageKeys.phone);

  String? readName() => _box.read<String>(StorageKeys.name);

  String? readRole() => _box.read<String>(StorageKeys.role);

  Future<void> writeRole(String? value) async {
    if (value == null) {
      await _box.remove(StorageKeys.role);
      return;
    }
    await _box.write(StorageKeys.role, value);
  }

  bool readKyc() => _box.read<bool>(StorageKeys.kyc) ?? false;

  Future<void> writeKyc(bool? value) async {
    if (value == null) {
      await _box.remove(StorageKeys.kyc);
      return;
    }
    await _box.write(StorageKeys.kyc, value);
  }

  String? readStatus() => _box.read<String>(StorageKeys.status);

  Future<void> writeStatus(String? value) async {
    if (value == null) {
      await _box.remove(StorageKeys.status);
      return;
    }
    await _box.write(StorageKeys.status, value);
  }

  Future<void> writePhone(String? phone) async {
    if (phone == null) {
      await _box.remove(StorageKeys.phone);
      return;
    }
    await _box.write(StorageKeys.phone, phone);
  }

  Future<void> writeName(String? name) async {
    if (name == null) {
      await _box.remove(StorageKeys.name);
      return;
    }
    await _box.write(StorageKeys.name, name);
  }

  Future<void> clear() async {
    await _box.erase();
  }
}
