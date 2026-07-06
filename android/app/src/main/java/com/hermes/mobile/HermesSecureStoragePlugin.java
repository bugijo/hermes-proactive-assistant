package com.hermes.mobile;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "HermesSecureStorage")
public class HermesSecureStoragePlugin extends Plugin {
    private static final String KEY_ALIAS = "hermes.mobile.session.v1";
    private static final String STORE = "hermes_secure_storage";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(STORE, Context.MODE_PRIVATE);
    }

    private SecretKey key() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
         .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
         .setRandomizedEncryptionRequired(true)
         .build());
        return generator.generateKey();
    }

    @PluginMethod
    public void set(PluginCall call) {
        String itemKey = call.getString("key");
        String value = call.getString("value");
        if (itemKey == null || value == null) {
            call.reject("key and value are required");
            return;
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key());
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            String payload = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + "." +
                Base64.encodeToString(encrypted, Base64.NO_WRAP);
            preferences().edit().putString(itemKey, payload).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to store encrypted value", error);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String itemKey = call.getString("key");
        if (itemKey == null) {
            call.reject("key is required");
            return;
        }
        JSObject result = new JSObject();
        String payload = preferences().getString(itemKey, null);
        if (payload == null) {
            result.put("value", JSObject.NULL);
            call.resolve(result);
            return;
        }
        try {
            String[] parts = payload.split("\\.", 2);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
            byte[] clear = cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP));
            result.put("value", new String(clear, StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (Exception error) {
            preferences().edit().remove(itemKey).apply();
            call.reject("Unable to decrypt stored value", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String itemKey = call.getString("key");
        if (itemKey == null) {
            call.reject("key is required");
            return;
        }
        preferences().edit().remove(itemKey).apply();
        call.resolve();
    }
}
