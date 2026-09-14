import ExpoModulesCore
import CoreImage
import UIKit

public class ReMakeFaceDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReMakeFaceDetector")

    AsyncFunction("detectFaceBounds") { (imagePath: String) -> [String: Any]? in
      let cleanPath = imagePath.replacingOccurrences(of: "file://", with: "")
      guard let img = UIImage(contentsOfFile: cleanPath),
            let ciImg = CIImage(image: img) else {
        return nil
      }
      
      let options = [CIDetectorAccuracy: CIDetectorAccuracyHigh]
      guard let detector = CIDetector(ofType: CIDetectorTypeFace, context: nil, options: options) else {
        return nil
      }
      
      let features = detector.features(in: ciImg)
      guard let faceFeature = features.first as? CIFaceFeature else {
        return nil
      }
      
      // CoreImage coordinate system has origin at bottom-left. 
      // We need to translate this to top-left for standard image manipulation.
      let imgHeight = img.size.height
      let bounds = faceFeature.bounds
      
      // Calculate translated bounds
      let x = bounds.origin.x
      let y = imgHeight - bounds.origin.y - bounds.size.height
      let width = bounds.size.width
      let height = bounds.size.height
      
      return [
        "x": x,
        "y": y,
        "width": width,
        "height": height
      ]
    }
  }
}