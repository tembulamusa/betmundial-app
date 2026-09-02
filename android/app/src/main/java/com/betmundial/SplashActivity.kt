package com.betmundial

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
    private val handler = Handler(Looper.getMainLooper())
    private var navigated = false

    private val launchMain = Runnable {
        if (isFinishing || isDestroyed || navigated) return@Runnable
        navigated = true
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        handler.postDelayed(launchMain, 1200)
    }

    override fun onDestroy() {
        handler.removeCallbacks(launchMain)
        super.onDestroy()
    }
}
