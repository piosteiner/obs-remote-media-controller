import { useState } from 'react'
import { Monitor, Smartphone, Image, Layers, BookOpen, Settings, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import Header from '../components/common/Header'

/**
 * Help Page - User guide and OBS setup instructions
 */
function Help() {
  const [expandedSection, setExpandedSection] = useState('setup')

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const Section = ({ id, icon: Icon, title, children }) => {
    const isExpanded = expandedSection === id
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 prose prose-sm max-w-none">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Setup Guide</h1>
          <p className="text-gray-600">
            Learn how to use OBS Media Controller and set up OBS for remote image control
          </p>
        </div>

        <div className="space-y-4">
          {/* OBS Setup */}
          <Section id="setup" icon={Settings} title="OBS Setup Instructions">
            <div>
              <h3 className="font-semibold text-lg mb-3">Step 1: Create Image Sources in OBS</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Open OBS Studio</li>
                <li>In your scene, click the <strong>+</strong> button in the Sources panel</li>
                <li>Select <strong>"Browser"</strong> from the list</li>
                <li>Name it <strong>"Slot 1"</strong> (or any name you prefer)</li>
                <li>Click OK</li>
              </ol>

              <h3 className="font-semibold text-lg mb-3">Step 2: Configure the Browser Source</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>
                  In the URL field, enter:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    https://obs-media-control.piogino.ch/display?slot=1
                  </code>
                </li>
                <li>Set Width: <strong>1920</strong> (or your desired width)</li>
                <li>Set Height: <strong>1080</strong> (or your desired height)</li>
                <li>Check ✓ <strong>"Shutdown source when not visible"</strong> (optional, saves resources)</li>
                <li>Check ✓ <strong>"Refresh browser when scene becomes active"</strong> (recommended)</li>
                <li>Click OK</li>
              </ol>

              <h3 className="font-semibold text-lg mb-3">Step 3: Repeat for Additional Slots</h3>
              <p className="mb-4">
                Create more browser sources for Slot 2, 3, and 4:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-6">
                <li>Slot 2: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://obs-media-control.piogino.ch/display?slot=2</code></li>
                <li>Slot 3: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://obs-media-control.piogino.ch/display?slot=3</code></li>
                <li>Slot 4: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://obs-media-control.piogino.ch/display?slot=4</code></li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Step 4: Position Your Sources</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Resize and position each slot where you want images to appear</li>
                <li>You can overlay them, place them side-by-side, or in corners</li>
                <li>Right-click → Transform → Fit to screen (if needed)</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Pro Tip:</strong> Create a dedicated scene for presentations with all 4 slots pre-configured!
                </p>
              </div>
            </div>
          </Section>

          {/* How to Use Control Page */}
          <Section id="control" icon={Smartphone} title="Using the Control Page">
            <div>
              <h3 className="font-semibold text-lg mb-3">Control Panel Overview</h3>
              <p className="mb-4">
                The Control page lets you manage images in 4 different slots during your presentation.
              </p>

              <h4 className="font-semibold mb-2">Three Ways to Add Images to Slots:</h4>
              <ol className="list-decimal list-inside space-y-3 mb-6">
                <li>
                  <strong>URL</strong> - Click the "URL" button, paste an image URL, click "Set"
                </li>
                <li>
                  <strong>Upload</strong> - Click "Upload", select an image file from your computer
                </li>
                <li>
                  <strong>Paste</strong> - Copy an image (screenshot, right-click → copy image), click "Paste"
                </li>
              </ol>

              <h4 className="font-semibold mb-2">Clear a Slot:</h4>
              <p className="mb-4">
                Click the <strong>X</strong> button in the top-right corner of any slot to remove the image.
              </p>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✨ Best Practice:</strong> Use your iPad or phone to control images while presenting from your computer!
                </p>
              </div>
            </div>
          </Section>

          {/* Library Page */}
          <Section id="library" icon={Image} title="Using the Image Library">
            <div>
              <h3 className="font-semibold text-lg mb-3">Build Your Image Collection</h3>
              <p className="mb-4">
                The Library page lets you prepare images ahead of time and quickly assign them to slots during presentations.
              </p>

              <h4 className="font-semibold mb-2">Four Ways to Add Images to Library:</h4>
              <ol className="list-decimal list-inside space-y-3 mb-6">
                <li>
                  <strong>Add URL</strong> (Gray button) - Add images directly from web URLs
                </li>
                <li>
                  <strong>Paste</strong> (Green button) - Paste images from clipboard
                </li>
                <li>
                  <strong>Upload Images</strong> (Blue button) - Upload multiple files at once
                </li>
                <li>
                  <strong>Search</strong> - Filter your library to find specific images
                </li>
              </ol>

              <h4 className="font-semibold mb-2">Assign Images to Slots:</h4>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Click on any image in the library</li>
                <li>Enter the slot number (1, 2, 3, or 4)</li>
                <li>Image appears in OBS instantly!</li>
              </ol>

              <h4 className="font-semibold mb-2">Delete Images:</h4>
              <p className="mb-4">
                Hover over an image and click the red trash icon to remove it from the library.
              </p>

              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>📚 Workflow Tip:</strong> Before your meeting, upload all images to the Library. During the meeting, just click images to switch slots!
                </p>
              </div>
            </div>
          </Section>

          {/* Scenes */}
          <Section id="scenes" icon={Layers} title="Using Scenes (Coming Soon)">
            <div>
              <h3 className="font-semibold text-lg mb-3">Scene Presets</h3>
              <p className="mb-4">
                Scenes let you save and load configurations of all 4 slots at once.
              </p>

              <h4 className="font-semibold mb-2">Create a Scene:</h4>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Set up your slots with the images you want</li>
                <li>Go to the Scenes page</li>
                <li>Click "Create Scene"</li>
                <li>Enter a name (e.g., "Product Demo", "Team Photos")</li>
                <li>Scene is saved!</li>
              </ol>

              <h4 className="font-semibold mb-2">Load a Scene:</h4>
              <p className="mb-4">
                Click the "Load Scene" button on any saved scene to instantly restore all 4 slots to that configuration.
              </p>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Note:</strong> Scene functionality is currently in development. Backend integration coming soon!
                </p>
              </div>
            </div>
          </Section>

          {/* Display Page */}
          <Section id="display" icon={Monitor} title="Display Page (for OBS)">
            <div>
              <h3 className="font-semibold text-lg mb-3">What is the Display Page?</h3>
              <p className="mb-4">
                The Display page shows a single image slot in fullscreen. This is what OBS uses as a Browser Source.
              </p>

              <h4 className="font-semibold mb-2">URL Format:</h4>
              <code className="block bg-gray-100 px-4 py-2 rounded text-sm mb-4">
                https://obs-media-control.piogino.ch/display?slot=1
              </code>

              <h4 className="font-semibold mb-2">How it Works:</h4>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>When you update a slot from Control or Library, the Display page updates automatically</li>
                <li>Uses WebSocket for real-time updates (no refresh needed!)</li>
                <li>Shows only the image, no UI elements</li>
                <li>Black background when no image is set</li>
              </ul>

              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>🎬 Fun Fact:</strong> You can open Display pages in a regular browser to preview what OBS sees!
                </p>
              </div>
            </div>
          </Section>

          {/* Workflows */}
          <Section id="workflows" icon={BookOpen} title="Example Workflows">
            <div>
              <h3 className="font-semibold text-lg mb-3">Workflow 1: Live Presentation</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Open OBS on your computer with browser sources configured</li>
                <li>Open Control page on your iPad/phone</li>
                <li>Start your presentation / screen share</li>
                <li>Use iPad to switch images in OBS without leaving presentation</li>
                <li>Smooth, professional transitions!</li>
              </ol>

              <h3 className="font-semibold text-lg mb-3">Workflow 2: Pre-Meeting Prep</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Before meeting: Go to Library page</li>
                <li>Upload/paste all images you'll need</li>
                <li>During meeting: Click library images to assign to slots</li>
                <li>No fumbling with file dialogs during presentation!</li>
              </ol>

              <h3 className="font-semibold text-lg mb-3">Workflow 3: Screenshot Sharing</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Take screenshot (Windows + Shift + S)</li>
                <li>Go to Control page</li>
                <li>Click "Paste" on any slot</li>
                <li>Screenshot appears in OBS immediately</li>
                <li>Perfect for showing examples on the fly!</li>
              </ol>

              <h3 className="font-semibold text-lg mb-3">Workflow 4: Multi-Screen Setup</h3>
              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Slot 1: Product image (bottom-left)</li>
                <li>Slot 2: Logo (top-right corner)</li>
                <li>Slot 3: Team photo (center, when needed)</li>
                <li>Slot 4: Backup/alternative images</li>
                <li>Switch between layouts smoothly during stream</li>
              </ol>
            </div>
          </Section>

          {/* Troubleshooting */}
          <Section id="troubleshooting" icon={Settings} title="Troubleshooting">
            <div>
              <h3 className="font-semibold text-lg mb-3">Images Not Showing in OBS</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Check that the Browser Source URL is correct (includes ?slot=X)</li>
                <li>Verify the browser source is visible in OBS</li>
                <li>Try refreshing the browser source (right-click → Refresh)</li>
                <li>Make sure OBS has internet connection</li>
                <li>Check browser console for errors (right-click source → Interact)</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Images Not Updating</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Wait a few seconds - WebSocket connections take a moment</li>
                <li>Check your internet connection</li>
                <li>Refresh the browser source in OBS</li>
                <li>Try closing and reopening the Control page</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Paste Not Working</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Make sure you copied an image (not just a file path)</li>
                <li>Try clicking in the blue paste area and pressing Ctrl+V</li>
                <li>On iPad: Use external keyboard for paste functionality</li>
                <li>Alternative: Use Upload button instead</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">URL Images Not Loading</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Verify the URL is a direct image link (ends in .jpg, .png, etc.)</li>
                <li>Check if the website allows hotlinking (some block it)</li>
                <li>Try downloading the image and using Upload instead</li>
                <li>Make sure the URL is publicly accessible (not behind login)</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Can't Access /control or /library Directly</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>This should be fixed! Try clearing browser cache (Ctrl+Shift+R)</li>
                <li>Make sure you're using the latest version</li>
                <li>Check that you're using https:// (not http://)</li>
              </ul>
            </div>
          </Section>

          {/* Tips & Tricks */}
          <Section id="tips" icon={BookOpen} title="Tips & Tricks">
            <div>
              <h3 className="font-semibold text-lg mb-3">Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Use Library for pre-meeting prep, Control for live switching</li>
                <li>Keep commonly-used images in Library for quick access</li>
                <li>Use descriptive filenames when uploading images</li>
                <li>Test your OBS setup before important presentations</li>
                <li>Bookmark Control page on your iPad for quick access</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Performance Tips</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Use optimized images (not huge file sizes)</li>
                <li>WebP format works great for smaller file sizes</li>
                <li>Enable "Shutdown source when not visible" in OBS</li>
                <li>Close unused browser tabs to save memory</li>
              </ul>

              <h3 className="font-semibold text-lg mb-3">Creative Uses</h3>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Lower thirds: Use Slot 1 for speaker names/titles</li>
                <li>Product demos: Quick-switch between product images</li>
                <li>Reactions: Pre-load meme images for live reactions</li>
                <li>Polls/Q&A: Show questions from library</li>
                <li>Sponsors: Rotate sponsor logos during breaks</li>
              </ul>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-800">
                  <strong>🎨 Get Creative!</strong> This tool is designed for flexibility. Experiment with different layouts and workflows to find what works best for your content!
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-2">Need More Help?</h3>
          <p className="text-gray-600 mb-4">
            This tool is designed to be intuitive, but if you have questions or suggestions, feel free to reach out!
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/piosteiner/obs-remote-media-controller"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Help
