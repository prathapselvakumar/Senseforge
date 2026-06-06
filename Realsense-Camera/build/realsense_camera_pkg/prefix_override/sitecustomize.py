import sys
if sys.prefix == '/usr':
    sys.real_prefix = sys.prefix
    sys.prefix = sys.exec_prefix = '/home/laptop17/Projects/Realsense_Software/Realsense-Camera/install/realsense_camera_pkg'
