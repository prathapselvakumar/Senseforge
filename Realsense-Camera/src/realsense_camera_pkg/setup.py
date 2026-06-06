from setuptools import setup
import os
from glob import glob

package_name = 'realsense_camera_pkg'

setup(
    name=package_name,
    version='0.0.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='user',
    maintainer_email='user@todo.todo',
    description='Realsense camera computer vision nodes',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'object_shape_color_node = realsense_camera_pkg.object_shape_color_node:main',
            'hsv_node = realsense_camera_pkg.hsv_node:main',
            'yolo_world_node = realsense_camera_pkg.yolo_world_node:main',
        ],
    },
)
