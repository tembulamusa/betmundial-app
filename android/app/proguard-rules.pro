# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***);
    *** get*();
}
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# react-native-config
-keep class com.betmundial.BuildConfig { *; }

# Native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Parcelables
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# react-native-sqlite-storage
-keep class org.pgsqlite.** { *; }

# react-native-vector-icons
-keep class com.oblador.vectoricons.** { *; }

# react-native-inappbrowser-reborn
-keep class com.proyecto26.inappbrowser.** { *; }

# react-native-sms-retriever
-keep class com.google.android.gms.auth.api.phone.** { *; }
-dontwarn com.google.android.gms.**

# OkHttp / networking
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Kotlin metadata
-keep class kotlin.Metadata { *; }
