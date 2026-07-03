import ExpoModulesCore
import CoreImage
import UIKit

public class ReMakeFaceDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReMakeFaceDetector")

    AsyncFunction("detectFace") { (imagePath: String) -> Bool in
      // Remove file:// prefix to read local file
      let cleanPath = imagePath.replacingOccurrences(of: "file://", with: "")
      guard let img = UIImage(contentsOfFile: cleanPath),
            let ciImg = CIImage(image: img) else {
        return false
      }
      
      // Configure apple's high-accuracy hardware face detector
      let options = [CIDetectorAccuracy: CIDetectorAccuracyHigh]
      guard let detector = CIDetector(ofType: CIDetectorTypeFace, context: nil, options: options) else {
        return false
      }
      
      let features = detector.features(in: ciImg)
      return !features.isEmpty
    }
  }
}
