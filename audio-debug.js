// Audio Context Test - Run this in browser console to debug audio issues

console.log('🎵 MusicPad Audio Diagnostic Tool');
console.log('=====================================');

// Test 1: Check Tone.js state
console.log('1. Tone.js State:');
console.log('  - Context State:', Tone.context.state);
console.log('  - Sample Rate:', Tone.context.sampleRate);
console.log('  - Current Time:', Tone.context.currentTime);

// Test 2: Check Audio Context
console.log('\n2. Audio Context:');
console.log('  - State:', Tone.context.rawContext.state);
console.log('  - Base Latency:', Tone.context.rawContext.baseLatency);
console.log('  - Output Latency:', Tone.context.rawContext.outputLatency);

// Test 3: Try to start audio
console.log('\n3. Testing Audio Start...');
async function testAudioStart() {
  try {
    await Tone.start();
    console.log('✅ Tone.start() successful');
    console.log('  - New Context State:', Tone.context.state);
    
    // Test basic oscillator
    const osc = new Tone.Oscillator(440, 'sine').toDestination();
    osc.start();
    osc.stop('+0.5');
    console.log('✅ Test oscillator created and triggered');
    
    // Test volume
    const vol = new Tone.Volume(-20).toDestination();
    const testOsc = new Tone.Oscillator(220, 'sine').connect(vol);
    testOsc.start();
    testOsc.stop('+0.3');
    console.log('✅ Volume control test successful');
    
  } catch (error) {
    console.error('❌ Audio start failed:', error);
  }
}

// Test 4: Check user gesture requirement
console.log('\n4. User Gesture Test:');
if (Tone.context.state === 'suspended') {
  console.log('⚠️  Audio context is suspended - user gesture required');
  console.log('   Click anywhere on the page to enable audio');
} else {
  console.log('✅ Audio context is ready');
}

// Run tests
testAudioStart();

// Test 5: MusicPad specific tests
console.log('\n5. MusicPad Engine Test:');
try {
  const engine = window.HighPerformanceAudioEngine?.getInstance();
  if (engine) {
    console.log('✅ MusicPad audio engine found');
    console.log('  - Engine State:', engine.context?.state);
  } else {
    console.log('⚠️  MusicPad audio engine not found - may not be initialized yet');
  }
} catch (error) {
  console.log('⚠️  Could not access MusicPad engine:', error.message);
}

console.log('\n=====================================');
console.log('📋 Diagnosis Complete');
console.log('If you see ❌ errors, try clicking the "Enable Audio" button');
console.log('If problems persist, check browser permissions and try refreshing');